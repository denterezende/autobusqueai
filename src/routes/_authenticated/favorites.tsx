import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listFavorites } from "@/lib/parts.functions";
import { Star, ChevronRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const fn = useServerFn(listFavorites);
  const q = useQuery({ queryKey: ["favorites"], queryFn: () => fn() });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <div className="font-mono text-[11px] uppercase tracking-widest text-primary">Salvos</div>
        <h1 className="mt-2 text-3xl font-bold flex items-center gap-2">
          <Star className="h-6 w-6 text-primary fill-primary" />
          Favoritos
        </h1>
      </div>

      {q.isLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}

      {q.data && q.data.length === 0 && (
        <div className="panel rounded-lg p-10 text-center">
          <Star className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum favorito salvo.</p>
          <Link to="/app" className="mt-4 inline-block text-primary hover:underline text-sm">
            Escanear uma peça →
          </Link>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {q.data?.map((f) => {
          const part = Array.isArray(f.parts) ? f.parts[0] : f.parts;
          if (!part) return null;
          const conf = Math.round((Number(part.ai_confidence) || 0) * 100);
          return (
            <Link
              key={f.id}
              to="/result/$id"
              params={{ id: part.id }}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-panel px-4 py-3 hover:border-primary/50 transition"
            >
              <div className="min-w-0">
                <div className="font-semibold truncate">{part.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  OEM {part.oem_code ?? "—"} · {conf}%
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
