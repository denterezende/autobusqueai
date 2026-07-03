import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPart, toggleFavorite } from "@/lib/parts.functions";
import { Star, ArrowLeft, Loader2, ImageOff, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/result/$id")({
  component: ResultPage,
});

const NOT_FOUND = "Informação não encontrada em base oficial.";

function ResultPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getPartFn = useServerFn(getPart);
  const favFn = useServerFn(toggleFavorite);

  const q = useQuery({
    queryKey: ["part", id],
    queryFn: () => getPartFn({ data: { id } }),
  });

  const favMut = useMutation({
    mutationFn: () => favFn({ data: { kind: "part", targetId: id } }),
    onSuccess: (res) => {
      toast.success(res.favorited ? "Adicionado aos favoritos" : "Removido dos favoritos");
      qc.invalidateQueries({ queryKey: ["part", id] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  if (q.isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (q.error || !q.data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center">
        <p className="text-muted-foreground">Peça não encontrada.</p>
        <Link to="/_authenticated/app" className="mt-4 inline-block text-primary hover:underline">
          ← Voltar
        </Link>
      </div>
    );
  }

  const { part, imageUrl, isFavorite } = q.data;
  const conf = Math.round((Number(part.ai_confidence) || 0) * 100);
  const compatibleVehicles = (part.compatible_vehicles as Array<{ brand: string; model: string; years?: string | null }> | null) ?? [];
  const measurements = (part.measurements as Record<string, string | null> | null) ?? {};
  const tools = (part.tools as string[] | null) ?? [];
  const altCodes = (part.alt_codes as string[] | null) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/_authenticated/app" })}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Nova busca
        </button>
        <button
          onClick={() => favMut.mutate()}
          disabled={favMut.isPending}
          className={`inline-flex items-center gap-2 rounded-md border px-4 py-1.5 text-sm font-semibold transition ${
            isFavorite
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/50"
          }`}
        >
          <Star className={`h-4 w-4 ${isFavorite ? "fill-primary" : ""}`} />
          {isFavorite ? "Favoritado" : "Favoritar"}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-[380px_1fr]">
        {/* Image + confidence */}
        <div className="space-y-4">
          <div className="panel rounded-lg overflow-hidden aspect-square grid place-items-center bg-background">
            {imageUrl ? (
              <img src={imageUrl} alt={part.name} className="h-full w-full object-cover" />
            ) : (
              <ImageOff className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          <div className="panel rounded-lg p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Confiança da IA
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`font-mono text-4xl font-bold ${
                conf >= 80 ? "text-success" : conf >= 50 ? "text-primary" : "text-destructive"
              }`}>
                {conf}%
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {conf >= 80 ? "Alta" : conf >= 50 ? "Média" : "Baixa"}
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full ${conf >= 80 ? "bg-success" : conf >= 50 ? "bg-primary" : "bg-destructive"}`}
                style={{ width: `${conf}%` }}
              />
            </div>
            {conf < 70 && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-2 text-xs">
                <Info className="h-3.5 w-3.5 mt-0.5 text-warning shrink-0" />
                <span>Confiança abaixo de 70%. Verifique os códigos antes de comprar.</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="panel rounded-lg p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
              Peça identificada
            </div>
            <h1 className="mt-1 text-3xl font-bold">{part.name}</h1>
            {part.position && (
              <div className="mt-1 text-sm text-muted-foreground">
                {part.position}{part.side ? ` · lado ${part.side}` : ""}
              </div>
            )}
            {part.description && (
              <p className="mt-3 text-sm text-foreground/90">{part.description}</p>
            )}
          </div>

          {/* Códigos */}
          <div className="panel rounded-lg p-5">
            <SectionHeader>Códigos</SectionHeader>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <DataRow label="OEM (montadora)">
                <code className="font-mono text-lg font-bold text-primary">
                  {part.oem_code || NOT_FOUND}
                </code>
              </DataRow>
              <DataRow label="Alternativos">
                {altCodes.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {altCodes.map((c, i) => (
                      <code key={i} className="rounded-sm bg-secondary px-2 py-0.5 font-mono text-xs">{c}</code>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{NOT_FOUND}</span>
                )}
              </DataRow>
            </div>
          </div>

          {/* Especificações */}
          <div className="panel rounded-lg p-5">
            <SectionHeader>Especificações técnicas</SectionHeader>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Spec label="Material" value={part.material} />
              <Spec label="Peso" value={part.weight} />
              <Spec label="Torque de aperto" value={part.torque} />
              <Spec label="Comprimento" value={measurements.length} />
              <Spec label="Largura" value={measurements.width} />
              <Spec label="Altura" value={measurements.height} />
              <Spec label="Diâmetro" value={measurements.diameter} />
              <Spec label="Espessura" value={measurements.thickness} />
            </div>
          </div>

          {/* Instalação */}
          <div className="panel rounded-lg p-5">
            <SectionHeader>Instalação e troca</SectionHeader>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Spec label="Dificuldade" value={part.difficulty} />
              <Spec label="Tempo médio" value={part.avg_time} />
              <Spec label="Localização" value={part.position} />
            </div>
            <DataRow label="Ferramentas necessárias" className="mt-4">
              {tools.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {tools.map((t, i) => (
                    <span key={i} className="rounded-sm border border-border px-2 py-0.5 text-xs">{t}</span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">{NOT_FOUND}</span>
              )}
            </DataRow>
          </div>

          {/* Compatibilidade */}
          <div className="panel rounded-lg p-5">
            <SectionHeader>Veículos compatíveis</SectionHeader>
            {compatibleVehicles.length ? (
              <div className="mt-3 divide-y divide-border">
                {compatibleVehicles.map((v, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-semibold">{v.brand} {v.model}</div>
                      {v.years && (
                        <div className="font-mono text-[11px] text-muted-foreground">{v.years}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{NOT_FOUND}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-widest text-primary border-b border-border pb-2">
      {children}
    </div>
  );
}

function DataRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value?: string | null }) {
  return (
    <DataRow label={label}>
      <span className={`text-sm ${value ? "font-mono font-semibold" : "text-muted-foreground italic"}`}>
        {value || NOT_FOUND}
      </span>
    </DataRow>
  );
}
