## Objetivo
Permitir revisar e corrigir os códigos lidos por OCR antes de rodar a identificação da peça.

## Mudanças

### 1. `src/lib/parts.functions.ts` — separar em duas server fns
- **Nova `ocrPart`** (`POST`, autenticada): recebe `{ imageBase64, mimeType }`, faz upload no bucket `part-images` e roda apenas o pass 1 (Gemini OCR). Retorna `{ imagePath, mimeType, codes: string[], rawText: string }`. Não grava em `parts` nem em `search_history`.
- **`identifyPart` refatorada**: passa a receber `{ imagePath, mimeType, codes: string[], vehicleContext? }` (imagem já no storage, códigos já revisados pelo usuário). Baixa a imagem via `supabase.storage.from('part-images').download(imagePath)`, converte para base64/dataURL, e executa somente o pass 2 (identificação) usando os `codes` recebidos como `ocr_codes`/entrada prioritária para `oem_code` e `alt_codes`. Continua gravando `parts` + `search_history` e retornando `{ id }`.
- Manter o merge de segurança que força os códigos revisados dentro de `parsed.ocr_codes` e `parsed.alt_codes`.
- Zod input validators atualizados de acordo.

### 2. `src/routes/_authenticated/app.tsx` — UI em duas etapas
Estados locais:
- `step: 'upload' | 'review' | 'loading'`
- `ocrResult: { imagePath, mimeType, codes: string[], rawText: string } | null`
- `editableCodes: string[]` (editável pelo usuário)

Fluxo:
1. **Upload** (como hoje): ao submeter, chama `ocrPart` em vez de `identifyPart`. Mostra loading "Lendo códigos na peça…". Ao retornar, guarda resultado e vai para `review`.
2. **Review**: mostra a foto (preview local ou signed URL), lista os códigos como chips editáveis:
   - cada chip com input inline + botão remover (X)
   - botão "Adicionar código" para inserir manualmente um código que o OCR não pegou
   - texto auxiliar mostrando `rawText` bruto (colapsável) para referência
   - campos de contexto do veículo (mantidos)
   - dois botões: "Voltar" (limpa e volta a `upload`) e "Identificar peça" (chama `identifyPart` com `imagePath`, `mimeType`, `codes` finais e `vehicleContext`, depois redireciona para `/_authenticated/result/$id`).
3. **Loading**: spinner enquanto `identifyPart` roda.

Validação client-side: normalizar cada código (trim, uppercase, 3–40 chars, `[A-Z0-9./-]`), dedup, permitir lista vazia (usuário pode prosseguir sem códigos).

### 3. Sem mudanças em
- schema do banco (`parts`, `search_history`) — bucket e colunas já suportam.
- `result.$id.tsx` — continua exibindo `ocr_codes` como hoje.
- migrations.

## Detalhes técnicos
- `ocrPart` reutiliza o helper `callGateway` e o mesmo prompt de OCR já existente; só extrai e devolve, sem gravar.
- Em `identifyPart`, para reconstruir o dataURL a partir do storage: `const { data: blob } = await supabase.storage.from('part-images').download(imagePath); const buf = Buffer.from(await blob.arrayBuffer()); const b64 = buf.toString('base64');`.
- Autorização: ambas as fns já usam `requireSupabaseAuth`; RLS do bucket garante que o usuário só baixa arquivos do próprio prefixo `${userId}/`.
- Contadores/histórico: `search_history` continua sendo inserido apenas no final (em `identifyPart`), evitando ruído se o usuário abandonar na etapa de revisão.
