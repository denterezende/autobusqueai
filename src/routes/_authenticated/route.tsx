import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Scan, History, Star, Settings, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const router = useRouter();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
          <Link to="/app" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-primary-foreground">
              <Scan className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-mono text-sm font-bold uppercase tracking-widest">
              AutoBusque<span className="text-primary">·IA</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            <NavLink to="/app" icon={<Scan className="h-4 w-4" />} label="Identificar" />
            <NavLink to="/history" icon={<History className="h-4 w-4" />} label="Histórico" />
            <NavLink to="/favorites" icon={<Star className="h-4 w-4" />} label="Favoritos" />
            <NavLink to="/settings" icon={<Settings className="h-4 w-4" />} label="Perfil" />
          </nav>

          <div className="ml-auto">
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
        <nav className="flex md:hidden border-t border-border">
          <MobileNav to="/app" icon={<Scan className="h-4 w-4" />} label="IA" />
          <MobileNav to="/history" icon={<History className="h-4 w-4" />} label="Histórico" />
          <MobileNav to="/favorites" icon={<Star className="h-4 w-4" />} label="Favoritos" />
          <MobileNav to="/settings" icon={<Settings className="h-4 w-4" />} label="Perfil" />
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "text-foreground bg-secondary" }}
      inactiveProps={{ className: "text-muted-foreground" }}
      className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 hover:text-foreground hover:bg-secondary"
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNav({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "text-primary border-t-2 border-primary" }}
      inactiveProps={{ className: "text-muted-foreground border-t-2 border-transparent" }}
      className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium uppercase tracking-wider"
    >
      {icon}
      {label}
    </Link>
  );
}
