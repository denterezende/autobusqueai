import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile, getIntegrationHealth } from "@/lib/parts.functions";
import { useEffect, useState } from "react";
import { Settings, Loader2, Wrench, Store, Building2, User, Activity, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { parseIntegrationError, toastIntegrationError } from "@/lib/integration-errors";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

type ProfileType = "mechanic" | "parts_shop" | "dealership" | "consumer";

const OPTIONS: { value: ProfileType; label: string; icon: React.ReactNode }[] = [
  { value: "mechanic", label: "Mecânico", icon: <Wrench className="h-4 w-4" /> },
  { value: "parts_shop", label: "Autopeça", icon: <Store className="h-4 w-4" /> },
  { value: "dealership", label: "Concessionária", icon: <Building2 className="h-4 w-4" /> },
  { value: "consumer", label: "Consumidor", icon: <User className="h-4 w-4" /> },
];

function SettingsPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getProfile);
  const updFn = useServerFn(updateProfile);
  const q = useQuery({ queryKey: ["profile"], queryFn: () => getFn() });

  const [fullName, setFullName] = useState("");
  const [profileType, setProfileType] = useState<ProfileType>("consumer");

  useEffect(() => {
    if (q.data) {
      setFullName(q.data.full_name ?? "");
      setProfileType((q.data.profile_type as ProfileType) ?? "consumer");
    }
  }, [q.data]);

  const mut = useMutation({
    mutationFn: () => updFn({ data: { full_name: fullName, profile_type: profileType } }),
    onSuccess: () => {
      toast.success("Perfil atualizado");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <div className="font-mono text-[11px] uppercase tracking-widest text-primary">Conta</div>
        <h1 className="mt-2 text-3xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Meu perfil
        </h1>
      </div>

      {q.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <div className="panel rounded-lg p-6 space-y-5">
          <label className="block">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Nome completo
            </div>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Tipo de conta
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setProfileType(o.value)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    profileType === o.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {o.icon}
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="w-full rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {mut.isPending ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      )}

      <IntegrationHealthCard />
    </div>
  );
}

function IntegrationHealthCard() {
  const healthFn = useServerFn(getIntegrationHealth);
  const h = useQuery({
    queryKey: ["integration-health"],
    queryFn: () => healthFn(),
    refetchOnWindowFocus: false,
  });

  const statusColor =
    h.data?.status === "healthy"
      ? "text-success border-success/40 bg-success/5"
      : h.data?.status === "degraded"
        ? "text-warning border-warning/40 bg-warning/5"
        : "text-destructive border-destructive/40 bg-destructive/5";

  const statusLabel =
    h.data?.status === "healthy"
      ? "Operacional"
      : h.data?.status === "degraded"
        ? "Degradado"
        : h.data?.status === "down"
          ? "Fora do ar"
          : "—";

  return (
    <div className="panel rounded-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Saúde da integração de IA</h2>
        </div>
        <button
          onClick={() => h.refetch()}
          disabled={h.isFetching}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${h.isFetching ? "animate-spin" : ""}`} />
          Testar agora
        </button>
      </div>

      {h.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verificando…
        </div>
      ) : h.error ? (
        <div className="text-sm text-destructive">Falha ao consultar: {(h.error as Error).message}</div>
      ) : h.data ? (
        <div className="space-y-3">
          <div className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-mono uppercase tracking-widest ${statusColor}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {statusLabel} · {h.data.totalMs}ms
          </div>
          <div className="grid gap-2">
            <HealthRow name="LOVABLE_API_KEY" ok={h.data.checks.apiKey.ok} detail={h.data.checks.apiKey.detail} />
            <HealthRow
              name="AI Gateway (chat)"
              ok={h.data.checks.gateway.ok}
              detail={h.data.checks.gateway.detail}
              latencyMs={h.data.checks.gateway.latencyMs}
            />
            <HealthRow
              name="Storage · part-images"
              ok={h.data.checks.storage.ok}
              detail={h.data.checks.storage.detail}
              latencyMs={h.data.checks.storage.latencyMs}
            />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Última verificação: {new Date(h.data.checkedAt).toLocaleString("pt-BR")}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HealthRow({
  name,
  ok,
  detail,
  latencyMs,
}: {
  name: string;
  ok: boolean;
  detail: string;
  latencyMs?: number | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-background px-3 py-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{name}</span>
          {latencyMs != null && (
            <span className="font-mono text-[10px] text-muted-foreground">{latencyMs}ms</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground break-words">{detail}</div>
      </div>
    </div>
  );
}
