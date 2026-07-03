
# Plano — AutoBusque IA (MVP web)

App web moderno (não Flutter — a stack Lovable é React/TanStack Start) para identificação de peças automotivas por IA, com busca estruturada, ficha técnica, favoritos, histórico e login multi-perfil.

## Escopo do MVP (o que entra agora)

1. **Autenticação multi-perfil** (Lovable Cloud)
   - Cadastro/login por e-mail+senha e Google.
   - No signup, o usuário escolhe o tipo de perfil: **Mecânico**, **Autopeça**, **Concessionária**, **Consumidor**.
   - Perfil salvo em tabela `profiles` (auto-criada por trigger).

2. **Busca estruturada**
   - Barra de busca livre (nome/código da peça).
   - Filtros: Marca, Modelo, Ano, Versão, Motor, VIN (chassi), Código OEM.
   - Atalhos rápidos por marca popular.

3. **Identificação por IA (destaque do produto)**
   - CTA grande "Identificar por foto" com duas opções: **tirar foto** (câmera do device) e **enviar imagem**.
   - Opcional: contexto do veículo (marca/modelo/ano) para ajudar a IA.
   - IA retorna: nome da peça, posição no veículo, % de confiança, código OEM (quando conhecido), veículos compatíveis, medidas/material/torque quando aplicável.
   - **Regra "nunca inventar"**: prompt força a IA a marcar campos como *"Informação não encontrada em base oficial."* quando não tiver certeza. % de confiança sempre visível.

4. **Ficha da peça (resultado)**
   - Foto enviada + dados técnicos em painel estilo scanner.
   - Códigos (OEM/alternativos), aplicações, medidas, material, local de instalação, dificuldade, ferramentas, tempo médio.
   - Botões: **Salvar em Favoritos**, **Compartilhar**, **Nova busca**.

5. **Favoritos**
   - Salvar peças e veículos. Lista dedicada.

6. **Histórico**
   - Toda identificação/busca do usuário fica registrada e reacessível.

7. **Design (Oficina pro industrial)**
   - Dark `#111` / painéis `#1F1F1F`, acento amarelo sinalização `#FACC15`, secundário azul `#3B82F6`.
   - Tipografia: `JetBrains Mono` (códigos/métricas) + `Inter` (UI).
   - Cards de alto contraste, bordas marcadas, chips de status, HUD de métricas em mono.

## Fora do escopo do MVP (fica para depois)

Vista explodida do sistema, comparador lado a lado, cadastro público de oficinas, orçamento em PDF, integração com lojas/preços, offline/PWA, leitor de código de barras, busca por voz, análise de vídeo, detecção de desgaste, atualização automática de catálogos externos. Deixamos ganchos no schema onde faz sentido.

## Arquitetura técnica

- **Stack**: TanStack Start (já configurado) + React + Tailwind v4 + shadcn.
- **Backend**: Lovable Cloud (Supabase gerenciado).
- **IA**: Lovable AI Gateway com `google/gemini-3-flash-preview` via `/v1/chat/completions` multimodal (imagem + texto). Chamada em `createServerFn` autenticada; retorno com schema estruturado (`Output.object` + Zod).
- **Storage**: bucket privado `part-images` para fotos enviadas; URL assinada exibida ao usuário.
- **Auth**: e-mail/senha + Google (via `lovable.auth.signInWithOAuth("google")`), rota `_authenticated/` gerenciada.

### Tabelas (schema inicial)

```text
profiles(id, user_id, full_name, profile_type, created_at)
  profile_type enum: mechanic | parts_shop | dealership | consumer

vehicles(id, user_id, brand, model, year, version, engine, vin, nickname, created_at)

parts(id, user_id, name, oem_code, alt_codes[], description,
      material, measurements jsonb, weight, torque,
      position, compatible_vehicles jsonb,
      image_path, ai_confidence, ai_raw jsonb, created_at)

favorites(id, user_id, kind, target_id, created_at)   -- kind: 'part' | 'vehicle'

search_history(id, user_id, kind, query jsonb, part_id nullable, created_at)
                                  -- kind: 'text' | 'image'
```

RLS: cada tabela `TO authenticated`, políticas `auth.uid() = user_id`. Storage: bucket privado, política de leitura/gravação por `owner = auth.uid()`.

### Rotas (TanStack)

```text
/                       → landing pública com CTA "Entrar" e demo
/auth                   → login / signup (email+senha, Google, seleção de perfil)
/_authenticated/app     → home do app (busca + identificar por foto)
/_authenticated/result/$id  → ficha da peça identificada
/_authenticated/history → histórico
/_authenticated/favorites → favoritos
/_authenticated/settings → perfil e tipo de conta
```

### Server functions

- `identifyPart({ imagePath, vehicleContext? })` — auth, faz upload assinado, chama Gateway multimodal, valida com Zod, grava em `parts` + `search_history`, retorna id.
- `searchParts({ filters })` — auth, busca em `parts` do usuário + placeholder para futura base pública.
- `toggleFavorite({ kind, targetId })`.
- `listHistory()`, `listFavorites()`.

## Design system

Tokens em `src/styles.css` (`@theme`), oklch:
- `--background: oklch(0.145 0 0)` (#111)
- `--card: oklch(0.205 0 0)` (#1F1F1F)
- `--primary: oklch(0.85 0.17 92)` (#FACC15 amarelo sinalização)
- `--accent: oklch(0.62 0.19 256)` (#3B82F6)
- Fontes via `@fontsource/inter` e `@fontsource/jetbrains-mono`.

## Entregáveis desta primeira build

1. Ativar Lovable Cloud, criar schema + RLS + bucket.
2. Configurar auth (email+senha + Google) e rota `_authenticated`.
3. Landing `/` reformulada (dark, hero + CTA).
4. Página `/auth` com seleção de perfil.
5. Home do app com busca + upload/câmera + estado vazio.
6. Server function `identifyPart` chamando Lovable AI Gateway (Gemini vision).
7. Página de resultado com ficha da peça e ações (favoritar, nova busca).
8. Histórico e Favoritos funcionais.
9. Design tokens + fontes + componentes de painel HUD.

Ao final, você terá um app utilizável ponta-a-ponta: login → tirar foto de uma peça → receber ficha técnica da IA → salvar → rever no histórico.
