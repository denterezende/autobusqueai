import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Scan, Wrench, Store, Building2, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

type ProfileType = "mechanic" | "parts_shop" | "dealership" | "consumer";

const PROFILE_OPTIONS: { value: ProfileType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "mechanic", label: "Mecânico", icon: <Wrench className="h-4 w-4" />, desc: "Oficina, autônomo" },
  { value: "parts_shop", label: "Autopeça", icon: <Store className="h-4 w-4" />, desc: "Loja de peças" },
  { value: "dealership", label: "Concessionária", icon: <Building2 className="h-4 w-4" />, desc: "Rede oficial" },
  { value: "consumer", label: "Consumidor", icon: <User className="h-4 w-4" />, desc: "Uso pessoal" },
];

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [profileType, setProfileType] = useState<ProfileType>("consumer");
  const [loading, setLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app", replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, profile_type: profileType },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Redirecionando…");
        navigate({ to: "/app", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/app", replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if (result.error) {
        toast.error(result.error.message || "Falha ao entrar com Google");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/app", replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground hud-grid">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <Link to="/" className="mb-8 flex items-center gap-2 self-center">
          <div className="grid h-8 w-8 place-items-center rounded-sm bg-primary text-primary-foreground">
            <Scan className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-mono text-sm font-bold uppercase tracking-widest">
            AutoBusque<span className="text-primary">·IA</span>
          </span>
        </Link>

        <div className="panel rounded-md p-6">
          <div className="mb-6 flex rounded-md bg-secondary p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-sm py-1.5 transition ${mode === "signin" ? "bg-background text-foreground" : "text-muted-foreground"}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-sm py-1.5 transition ${mode === "signup" ? "bg-background text-foreground" : "text-muted-foreground"}`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <Field label="Nome completo">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="input"
                    placeholder="José Silva"
                  />
                </Field>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Tipo de conta
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {PROFILE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setProfileType(opt.value)}
                        className={`flex flex-col items-start gap-1 rounded-md border p-2.5 text-left text-xs ${
                          profileType === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={profileType === opt.value ? "text-primary" : ""}>{opt.icon}</span>
                          <span className="font-semibold">{opt.label}</span>
                        </div>
                        <span className="text-muted-foreground">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="voce@empresa.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Senha">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input"
                placeholder="Mínimo 6 caracteres"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Processando…" : mode === "signup" ? "Criar conta" : "Entrar"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            ou
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 font-medium hover:bg-secondary disabled:opacity-50"
          >
            <GoogleIcon />
            Continuar com Google
          </button>
        </div>

        <Link to="/" className="mt-6 self-center text-xs text-muted-foreground hover:text-foreground">
          ← Voltar ao início
        </Link>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: 0.375rem;
          padding: 0.55rem 0.75rem;
          color: var(--color-foreground);
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px oklch(0.87 0.17 92 / 0.2);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
