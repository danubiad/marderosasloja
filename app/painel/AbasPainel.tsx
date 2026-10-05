import Link from "next/link";
import { sair } from "./actions";

const abas = [
  { href: "/painel", nome: "Pedidos" },
  { href: "/painel/carrinhos", nome: "Carrinhos" },
  { href: "/painel/clientes", nome: "Clientes" },
  { href: "/painel/revendedoras", nome: "Revendedoras" },
];

export function AbasPainel({ atual }: { atual: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-linha bg-white/95 backdrop-blur" style={{ top: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 pt-3">
        <span className="font-serif text-xl font-semibold">Painel</span>
        <div className="flex-1" />
        <Link href="/" className="text-sm text-suave underline">
          Ver catálogo
        </Link>
        <form action={sair}>
          <button type="submit" className="rounded-md border border-linha px-3 py-1 text-sm">
            Sair
          </button>
        </form>
      </div>
      <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 [scrollbar-width:none]">
        {abas.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium ${
              atual === a.href ? "border-dourado-escuro text-texto" : "border-transparent text-suave"
            }`}
          >
            {a.nome}
          </Link>
        ))}
      </nav>
    </header>
  );
}
