import { createFileRoute, Link } from "@tanstack/react-router";
import { Scan, Camera, Search, Zap, ShieldCheck, Database } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-primary-foreground">
              <Scan className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-mono text-sm font-bold uppercase tracking-widest">
              AutoBusque<span className="text-primary">·IA</span>
            </span>
          </div>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative hud-grid border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Scanner ativo · IA multimodal
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Identifique qualquer peça automotiva
              <span className="text-primary"> por foto</span>.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Catálogo inteligente para mecânicos, autopeças, concessionárias e consumidores.
              Envie uma imagem e a IA retorna nome, código OEM, veículos compatíveis e ficha técnica.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
              >
                <Camera className="h-5 w-5" />
                Começar agora
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 font-semibold hover:bg-secondary"
              >
                Como funciona
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              <Stat value="OEM" label="Códigos originais" />
              <Stat value="VIN" label="Leitura de chassi" />
              <Stat value="AI" label="Visão multimodal" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mb-10 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
              Módulos
            </div>
            <h2 className="mt-2 text-3xl font-bold">Feito para quem trabalha com peça</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Feature
            icon={<Camera className="h-5 w-5" />}
            title="Identificação por imagem"
            body="Tire uma foto da peça ou envie do celular. A IA identifica, mostra a posição no veículo e o percentual de confiança."
          />
          <Feature
            icon={<Search className="h-5 w-5" />}
            title="Busca completa"
            body="Pesquise por marca, modelo, ano, versão, motor, chassi (VIN), código OEM ou nome da peça."
          />
          <Feature
            icon={<Database className="h-5 w-5" />}
            title="Ficha técnica"
            body="Códigos alternativos, medidas, material, torque, veículos compatíveis e ferramentas para a troca."
          />
          <Feature
            icon={<Zap className="h-5 w-5" />}
            title="Compatibilidade cruzada"
            body="Descubra rapidamente todos os veículos que usam a mesma peça."
          />
          <Feature
            icon={<Star className="h-5 w-5" />}
            title="Favoritos e histórico"
            body="Salve peças e veículos, e retome consultas anteriores a qualquer momento."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Nunca inventa dado"
            body="Quando a IA não tem certeza, marca o campo como 'Informação não encontrada em base oficial'."
          />
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-border bg-panel">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h3 className="text-2xl md:text-3xl font-bold">Pronto para escanear a próxima peça?</h3>
          <p className="mt-3 text-muted-foreground">Criar sua conta leva 30 segundos.</p>
          <Link
            to="/auth"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
          >
            <Scan className="h-5 w-5" />
            Entrar no AutoBusque IA
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
          © {new Date().getFullYear()} AutoBusque IA
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l-2 border-primary pl-3">
      <div className="font-mono text-2xl font-bold text-primary">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="panel rounded-md p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="mt-4 font-semibold">{title}</div>
      <div className="mt-1.5 text-sm text-muted-foreground">{body}</div>
    </div>
  );
}

// Local Star import (avoid pulling too many icons)
function Star(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
