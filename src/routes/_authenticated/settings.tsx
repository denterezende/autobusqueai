import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "@/lib/parts.functions";
import { useEffect, useState } from "react";
import { Settings, Loader2, Wrench, Store, Building2, User } from "lucide-react";
import { toast } from "sonner";

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
    </div>
  );
}
