import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listHistory } from "@/lib/parts.functions";
import { History, Camera, Type, ChevronRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const fn = useServerFn(listHistory);
  const q = useQuery({ queryKey: ["history"], queryFn: () => fn() });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <div className="font-mono text-[11px] uppercase tracking-widest text-primary">Log</div>
        <h1 className="mt-2 text-3xl font-bold flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          Histórico de consultas
        </h1>
      </div>

      {q.isLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}

      {q.data && q.data.length === 0 && (
        <div className="panel rounded-lg p-10 text-center">
          <History className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma consulta ainda.</p>
          <Link to="/app" className="mt-4 inline-block text-primary hover:underline text-sm">
            Fazer primeira busca →
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {q.data?.map((h) => {
          const part = Array.isArray(h.parts) ? h.parts[0] : h.parts;
          const date = new Date(h.created_at).toLocaleString("pt-BR");
          return (
            <Link
              key={h.id}
              to={part ? "/result/$id" : "/app"}
              params={part ? { id: part.id } : undefined}
              className="flex items-center gap-3 rounded-md border border-border bg-panel px-4 py-3 hover:border-primary/50 transition"
            >
              <div className={`grid h-9 w-9 place-items-center rounded-sm ${h.kind === "image" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                {h.kind === "image" ? <Camera className="h-4 w-4" /> : <Type className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {part?.name ?? (h.kind === "text" ? "Busca por texto" : "Identificação por foto")}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {part?.oem_code ? `OEM ${part.oem_code} · ` : ""}{date}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
