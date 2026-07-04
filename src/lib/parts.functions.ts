import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ---- Types shared with client -----------------------------------------

export const CompatibleVehicle = z.object({
  brand: z.string(),
  model: z.string(),
  years: z.string().optional().nullable(),
});

export const IdentifyOutput = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
  oem_code: z.string().optional().nullable(),
  alt_codes: z.array(z.string()).default([]),
  material: z.string().optional().nullable(),
  measurements: z
    .object({
      length: z.string().optional().nullable(),
      width: z.string().optional().nullable(),
      height: z.string().optional().nullable(),
      diameter: z.string().optional().nullable(),
      thickness: z.string().optional().nullable(),
    })
    .partial()
    .optional()
    .nullable(),
  weight: z.string().optional().nullable(),
  torque: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  side: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  tools: z.array(z.string()).default([]),
  avg_time: z.string().optional().nullable(),
  compatible_vehicles: z.array(CompatibleVehicle).default([]),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional().nullable(),
  ocr_codes: z.array(z.string()).default([]),
});

const OcrOutput = z.object({
  codes: z.array(z.string()).default([]),
  raw_text: z.string().optional().nullable(),
});

export type IdentifyOutputT = z.infer<typeof IdentifyOutput>;

const NOT_FOUND = "Informação não encontrada em base oficial.";

const SYSTEM_PROMPT = `Você é o AutoBusque IA, um especialista em identificação de peças automotivas para veículos nacionais e importados. Você recebe uma foto de uma peça (e opcionalmente contexto de veículo) e retorna dados técnicos estruturados.

REGRAS ABSOLUTAS:
1. Você NUNCA inventa códigos OEM, medidas, torque, materiais ou compatibilidades. Se não tiver certeza de um dado, retorne exatamente a string "${NOT_FOUND}" naquele campo (ou null / array vazio quando aplicável).
2. Sempre retorne um valor honesto de "confidence" entre 0 e 1 representando quão confiante você está no diagnóstico geral.
3. Idioma: português do Brasil.
4. "position" descreve onde a peça fica no veículo (ex.: "suspensão dianteira", "sistema de arrefecimento").
5. "side" quando aplicável: "esquerdo", "direito", "central" ou null.
6. "compatible_vehicles" só deve conter veículos que você tem confiança real de compatibilidade. Vazio se não souber.
7. Responda APENAS em JSON válido conforme o schema pedido, sem markdown.`;

// ---- Server fns --------------------------------------------------------

function makeCallGateway(apiKey: string) {
  return async (body: unknown) => {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429) throw new Error("Limite de requisições da IA atingido. Tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      throw new Error(`Falha na IA (${res.status}): ${errText.slice(0, 200)}`);
    }
    return res.json();
  };
}

function normalizeCodes(codes: string[]): string[] {
  return Array.from(
    new Set(
      codes
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length >= 3 && c.length <= 40 && /[A-Z0-9]/.test(c)),
    ),
  );
}

export const ocrPart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        imageBase64: z.string().min(100),
        mimeType: z.string().default("image/jpeg"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const rawBase64 = data.imageBase64.includes(",")
      ? data.imageBase64.split(",")[1]
      : data.imageBase64;
    const bytes = Uint8Array.from(atob(rawBase64), (c) => c.charCodeAt(0));
    const ext = data.mimeType.split("/")[1] || "jpg";
    const imagePath = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("part-images")
      .upload(imagePath, bytes, { contentType: data.mimeType, upsert: false });
    if (upErr) throw new Error("Falha ao salvar imagem: " + upErr.message);

    const dataUrl = `data:${data.mimeType};base64,${rawBase64}`;
    const callGateway = makeCallGateway(apiKey);

    const ocrJson = await callGateway({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            'Você é um OCR especializado em peças automotivas. Leia toda e qualquer inscrição visível na peça (códigos gravados, estampados, etiquetas, part numbers, códigos de barras). Devolva SOMENTE JSON no formato {"codes": string[], "raw_text": string}. "codes" deve conter apenas strings alfanuméricas (aceite hífens, pontos e barras) que pareçam códigos/part numbers — nada de palavras comuns. Se não houver nada legível, retorne {"codes": [], "raw_text": ""}. Não invente nada.',
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extraia todos os códigos e textos visíveis nesta peça." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    let codes: string[] = [];
    let rawText = "";
    try {
      const raw = ocrJson.choices?.[0]?.message?.content ?? "{}";
      const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
      const parsed = OcrOutput.parse(obj);
      codes = normalizeCodes(parsed.codes);
      rawText = parsed.raw_text ?? "";
    } catch (e) {
      console.warn("OCR parse fail:", e);
    }

    return { imagePath, mimeType: data.mimeType, codes, rawText };
  });

export const identifyPart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        imagePath: z.string().min(1),
        mimeType: z.string().default("image/jpeg"),
        codes: z.array(z.string()).default([]),
        vehicleContext: z
          .object({
            brand: z.string().optional(),
            model: z.string().optional(),
            year: z.string().optional(),
            version: z.string().optional(),
            engine: z.string().optional(),
            vin: z.string().optional(),
          })
          .partial()
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    // Ensure image belongs to this user (RLS also enforces via storage prefix)
    if (!data.imagePath.startsWith(`${userId}/`)) {
      throw new Error("Imagem inválida.");
    }

    // Download image from storage and reconstruct dataURL
    const { data: blob, error: dlErr } = await supabase.storage
      .from("part-images")
      .download(data.imagePath);
    if (dlErr || !blob) throw new Error("Falha ao ler imagem: " + (dlErr?.message ?? ""));
    const arrBuf = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(arrBuf);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const rawBase64 = btoa(binary);
    const dataUrl = `data:${data.mimeType};base64,${rawBase64}`;

    const reviewedCodes = normalizeCodes(data.codes);
    const ctx = data.vehicleContext;
    const ctxLine =
      ctx && Object.values(ctx).some(Boolean)
        ? `Contexto do veículo informado pelo usuário: ${JSON.stringify(ctx)}`
        : "Nenhum contexto de veículo foi informado.";
    const ocrLine =
      reviewedCodes.length > 0
        ? `Códigos revisados pelo usuário (OCR + correções manuais). Use-os como fonte prioritária de oem_code e alt_codes; NÃO os descarte: ${JSON.stringify(reviewedCodes)}`
        : "Nenhum código foi fornecido pelo usuário.";

    const userText = `${ctxLine}
${ocrLine}

Analise a foto anexada e identifique a peça automotiva. Retorne APENAS um JSON válido no formato:
{
  "name": string,
  "description": string | null,
  "oem_code": string | null,
  "alt_codes": string[],
  "material": string | null,
  "measurements": { "length"?: string, "width"?: string, "height"?: string, "diameter"?: string, "thickness"?: string } | null,
  "weight": string | null,
  "torque": string | null,
  "position": string | null,
  "side": "esquerdo" | "direito" | "central" | null,
  "difficulty": "fácil" | "média" | "difícil" | null,
  "tools": string[],
  "avg_time": string | null,
  "compatible_vehicles": [{ "brand": string, "model": string, "years": string | null }],
  "confidence": number (0..1),
  "notes": string | null,
  "ocr_codes": string[]
}

Regras extras:
- Sempre inclua em "ocr_codes" a lista de códigos revisados informados acima (repita-os fielmente).
- Se houver códigos revisados, "oem_code" deve preferencialmente ser um deles (aquele que você reconhece como o part number principal). Os demais códigos vão em "alt_codes".
- Campos desconhecidos DEVEM ser null, "${NOT_FOUND}", ou array vazio — nunca inventados.`;

    const callGateway = makeCallGateway(apiKey);
    const aiJson = await callGateway({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = aiJson.choices?.[0]?.message?.content ?? "{}";
    let parsed: IdentifyOutputT;
    try {
      const obj = typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
      parsed = IdentifyOutput.parse(obj);
    } catch (e) {
      console.error("AI parse fail:", e, rawContent);
      throw new Error("A IA retornou um formato inesperado. Tente uma foto mais clara.");
    }

    if (reviewedCodes.length > 0) {
      parsed.ocr_codes = Array.from(new Set([...(parsed.ocr_codes ?? []), ...reviewedCodes]));
      const allAlt = new Set([...(parsed.alt_codes ?? []), ...reviewedCodes]);
      if (parsed.oem_code) allAlt.delete(parsed.oem_code.toUpperCase());
      parsed.alt_codes = Array.from(allAlt);
    }

    const { data: partRow, error: insErr } = await supabase
      .from("parts")
      .insert({
        user_id: userId,
        name: parsed.name,
        oem_code: parsed.oem_code,
        alt_codes: parsed.alt_codes,
        description: parsed.description,
        material: parsed.material,
        measurements: parsed.measurements ?? {},
        weight: parsed.weight,
        torque: parsed.torque,
        position: parsed.position,
        side: parsed.side,
        difficulty: parsed.difficulty,
        tools: parsed.tools,
        avg_time: parsed.avg_time,
        compatible_vehicles: parsed.compatible_vehicles,
        image_path: data.imagePath,
        ai_confidence: parsed.confidence,
        ai_raw: parsed,
        vehicle_context: ctx ?? null,
      })
      .select("id")
      .single();
    if (insErr) throw new Error("Falha ao salvar peça: " + insErr.message);

    // 5. History
    await supabase.from("search_history").insert({
      user_id: userId,
      kind: "image",
      query: { vehicleContext: ctx ?? null },
      part_id: partRow.id,
    });

    return { id: partRow.id };
  });

export const getPart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: part, error } = await supabase
      .from("parts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!part) throw new Error("Peça não encontrada");
    let imageUrl: string | null = null;
    if (part.image_path) {
      const { data: signed } = await supabase.storage
        .from("part-images")
        .createSignedUrl(part.image_path, 3600);
      imageUrl = signed?.signedUrl ?? null;
    }
    const { data: fav } = await supabase
      .from("favorites")
      .select("id")
      .eq("kind", "part")
      .eq("target_id", data.id)
      .maybeSingle();
    return { part, imageUrl, isFavorite: !!fav };
  });

export const listHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("search_history")
      .select("id, kind, query, part_id, created_at, parts:part_id(id, name, oem_code, ai_confidence, image_path)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("favorites")
      .select("id, kind, target_id, created_at, parts:target_id(id, name, oem_code, ai_confidence, image_path)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ kind: z.enum(["part", "vehicle"]), targetId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("kind", data.kind)
      .eq("target_id", data.targetId)
      .maybeSingle();
    if (existing) {
      await supabase.from("favorites").delete().eq("id", existing.id);
      return { favorited: false };
    }
    await supabase.from("favorites").insert({
      user_id: userId,
      kind: data.kind,
      target_id: data.targetId,
    });
    return { favorited: true };
  });

export const searchTextHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        q: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        year: z.string().optional(),
        oem: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Save the search
    await supabase.from("search_history").insert({
      user_id: userId,
      kind: "text",
      query: data,
    });
    // Search user's own identified parts
    let q = supabase.from("parts").select("id, name, oem_code, ai_confidence, image_path, position").order("created_at", { ascending: false });
    if (data.q) q = q.ilike("name", `%${data.q}%`);
    if (data.oem) q = q.ilike("oem_code", `%${data.oem}%`);
    const { data: results, error } = await q.limit(50);
    if (error) throw new Error(error.message);
    return { results: results ?? [] };
  });

export const getSignedImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ path: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: signed } = await context.supabase.storage
      .from("part-images")
      .createSignedUrl(data.path, 3600);
    return { url: signed?.signedUrl ?? null };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, profile_type")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().min(1).max(120),
        profile_type: z.enum(["mechanic", "parts_shop", "dealership", "consumer"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.full_name, profile_type: data.profile_type })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
