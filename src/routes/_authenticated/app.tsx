import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { identifyPart, searchTextHistory } from "@/lib/parts.functions";
import { Camera, Upload, Search, Loader2, Scan, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppHome,
});

const POPULAR_BRANDS = [
  "Chevrolet", "Fiat", "Volkswagen", "Ford", "Toyota",
  "Honda", "Hyundai", "Renault", "Jeep", "Nissan",
];

function AppHome() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ctx, setCtx] = useState({ brand: "", model: "", year: "", engine: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchOem, setSearchOem] = useState("");

  const identifyFn = useServerFn(identifyPart);
  const searchFn = useServerFn(searchTextHistory);

  const identifyMut = useMutation({
    mutationFn: async (payload: { imageBase64: string; mimeType: string }) =>
      identifyFn({
        data: {
          imageBase64: payload.imageBase64,
          mimeType: payload.mimeType,
          vehicleContext: Object.fromEntries(Object.entries(ctx).filter(([, v]) => v)) as Record<string, string>,
        },
      }),
    onSuccess: (res) => {
      navigate({ to: "/_authenticated/result/$id", params: { id: res.id } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const searchMut = useMutation({
    mutationFn: async () => searchFn({ data: { q: searchQ, oem: searchOem, ...ctx } }),
    onSuccess: (res) => {
      if (res.results.length === 0) {
        toast.info("Nenhuma peça já identificada por você bate com esses filtros. Tente escanear por foto.");
      } else {
        toast.success(`${res.results.length} resultado(s) encontrado(s)`);
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 8MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      identifyMut.mutate({ imageBase64: dataUrl, mimeType: file.type || "image/jpeg" });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      {/* Header block */}
      <div className="mb-8">
        <div className="font-mono text-[11px] uppercase tracking-widest text-primary">
          Scanner / IA multimodal
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold">
          O que você precisa identificar hoje?
        </h1>
      </div>

      {/* Scan CTA */}
      <div className="panel rounded-lg overflow-hidden">
        <div className="border-b border-border bg-panel-elevated px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs uppercase tracking-widest font-semibold">
              Identificar peça por foto
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Powered by AI Vision
          </span>
        </div>

        <div className="grid md:grid-cols-[1fr_320px]">
          <div className="p-5">
            {identifyMut.isPending ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-md border border-dashed border-primary/50 bg-primary/5">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="text-center">
                  <div className="font-mono text-sm uppercase tracking-wider text-primary">
                    Analisando imagem…
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    A IA está comparando com catálogos e identificando a peça.
                  </div>
                </div>
                {preview && (
                  <img src={preview} alt="preview" className="h-24 w-24 rounded-md object-cover ring-2 ring-primary/30" />
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
                className="grid min-h-[240px] place-items-center rounded-md border-2 border-dashed border-border hover:border-primary/50 transition"
              >
                <div className="text-center">
                  <Scan className="mx-auto h-10 w-10 text-primary" />
                  <div className="mt-3 font-semibold">Arraste uma foto aqui ou:</div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <Camera className="h-4 w-4" />
                      Câmera
                    </button>
                    <button
                      onClick={() => {
                        const inp = fileRef.current;
                        if (!inp) return;
                        inp.removeAttribute("capture");
                        inp.click();
                        setTimeout(() => inp.setAttribute("capture", "environment"), 100);
                      }}
                      className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                    >
                      <Upload className="h-4 w-4" />
                      Enviar arquivo
                    </button>
                  </div>
                  <div className="mt-3 text-[11px] text-muted-foreground">
                    JPG, PNG ou WEBP · até 8 MB
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
              </div>
            )}
          </div>

          <div className="border-t md:border-t-0 md:border-l border-border bg-panel-elevated p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Contexto opcional
            </div>
            <div className="mt-3 space-y-2">
              <MiniField label="Marca" value={ctx.brand} onChange={(v) => setCtx({ ...ctx, brand: v })} placeholder="Chevrolet" />
              <MiniField label="Modelo" value={ctx.model} onChange={(v) => setCtx({ ...ctx, model: v })} placeholder="Onix" />
              <div className="grid grid-cols-2 gap-2">
                <MiniField label="Ano" value={ctx.year} onChange={(v) => setCtx({ ...ctx, year: v })} placeholder="2021" />
                <MiniField label="Motor" value={ctx.engine} onChange={(v) => setCtx({ ...ctx, engine: v })} placeholder="1.0 Turbo" />
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                Contexto ajuda a IA a acertar OEM e compatibilidade.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Text search */}
      <div className="mt-8 panel rounded-lg p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs uppercase tracking-widest font-semibold">
              Busca por texto / código
            </span>
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showFilters ? "Ocultar" : "Mais filtros"} <ChevronRight className={`inline h-3 w-3 transition ${showFilters ? "rotate-90" : ""}`} />
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Nome da peça (ex: pastilha de freio)"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={searchOem}
            onChange={(e) => setSearchOem(e.target.value)}
            placeholder="Código OEM"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
          />
          <button
            onClick={() => searchMut.mutate()}
            disabled={searchMut.isPending}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {searchMut.isPending ? "Buscando…" : "Buscar"}
          </button>
        </div>
        {showFilters && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
            <MiniField label="Marca" value={ctx.brand} onChange={(v) => setCtx({ ...ctx, brand: v })} />
            <MiniField label="Modelo" value={ctx.model} onChange={(v) => setCtx({ ...ctx, model: v })} />
            <MiniField label="Ano" value={ctx.year} onChange={(v) => setCtx({ ...ctx, year: v })} />
            <MiniField label="Motor" value={ctx.engine} onChange={(v) => setCtx({ ...ctx, engine: v })} />
          </div>
        )}

        {searchMut.data && searchMut.data.results.length > 0 && (
          <div className="mt-5 space-y-2">
            {searchMut.data.results.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate({ to: "/_authenticated/result/$id", params: { id: r.id } })}
                className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left hover:border-primary/50"
              >
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    OEM: {r.oem_code ?? "—"}{r.position ? ` · ${r.position}` : ""}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Brand shortcuts */}
      <div className="mt-8">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          Marcas populares
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_BRANDS.map((b) => (
            <button
              key={b}
              onClick={() => {
                setCtx({ ...ctx, brand: b });
                toast.success(`Contexto: marca ${b}`);
              }}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                ctx.brand === b
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
      />
    </label>
  );
}
