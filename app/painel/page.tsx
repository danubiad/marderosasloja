import type { Metadata } from "next";
import Link from "next/link";
import { IconeWhatsapp } from "@/components/icones";
import { formatarDocumento, formatarPreco, formatarTelefone } from "@/lib/format";
import { estaLogado, painelConfigurado } from "@/lib/painel";
import { listarPedidos, statusPedido, type StatusPedido } from "@/lib/pedidos";
import { sair } from "./actions";
import { FormLogin } from "./FormLogin";
import { SeletorStatus } from "./SeletorStatus";

export const metadata: Metadata = {
  title: "Painel de pedidos — Mar de Rosas",
  robots: { index: false, follow: false },
};

export default async function Painel({ searchParams }: PageProps<"/painel">) {
  if (!painelConfigurado()) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-semibold">Painel de pedidos</h1>
        <p className="mt-4 text-suave">
          O painel ainda não tem senha. Na Vercel, crie a variável de ambiente <code>PAINEL_SENHA</code> e faça um
          novo deploy.
        </p>
      </main>
    );
  }

  if (!(await estaLogado())) return <FormLogin />;

  const { status: filtroStatus, busca: buscaParam } = await searchParams;
  const filtro = typeof filtroStatus === "string" && filtroStatus in statusPedido ? (filtroStatus as StatusPedido) : null;
  const busca = typeof buscaParam === "string" ? buscaParam.trim().toLowerCase() : "";

  const todos = await listarPedidos();
  const contagem = Object.fromEntries(
    Object.keys(statusPedido).map((s) => [s, todos.filter((p) => (p.status ?? "novo") === s).length]),
  );

  const pedidos = todos.filter((p) => {
    if (filtro && (p.status ?? "novo") !== filtro) return false;
    if (!busca) return true;
    const alvo = `${p.numero} ${p.cliente.nome} ${p.cliente.documento} ${p.cliente.telefone} ${p.endereco.cidade}`.toLowerCase();
    return alvo.includes(busca.replace(/[.\-/()\s]/g, "")) || alvo.includes(busca);
  });
  const valorTotal = pedidos.filter((p) => p.status !== "cancelado").reduce((acc, p) => acc + p.total, 0);

  const linkFiltro = (s: string | null) => {
    const q = new URLSearchParams();
    if (s) q.set("status", s);
    if (busca) q.set("busca", busca);
    const qs = q.toString();
    return qs ? `/painel?${qs}` : "/painel";
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Pedidos</h1>
          <p className="text-sm text-suave">
            {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"} · {formatarPreco(valorTotal)}
            {filtro !== "cancelado" && " (sem cancelados)"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-suave underline">
            Ver catálogo
          </Link>
          <form action={sair}>
            <button type="submit" className="rounded-md border border-linha px-3 py-1.5 text-sm">
              Sair
            </button>
          </form>
        </div>
      </header>

      <form className="mt-5" action="/painel">
        {filtro && <input type="hidden" name="status" value={filtro} />}
        <input
          type="search"
          name="busca"
          defaultValue={busca}
          placeholder="Buscar por nº, nome, CPF/CNPJ, telefone ou cidade"
          className="w-full rounded-md border border-linha px-4 py-2.5 outline-none focus:border-dourado"
        />
      </form>

      <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <Link
          href={linkFiltro(null)}
          className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${!filtro ? "bg-texto text-white" : "bg-fundo"}`}
        >
          Todos ({todos.length})
        </Link>
        {Object.entries(statusPedido).map(([s, nome]) => (
          <Link
            key={s}
            href={linkFiltro(s)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${filtro === s ? "bg-texto text-white" : "bg-fundo"}`}
          >
            {nome} ({contagem[s]})
          </Link>
        ))}
      </nav>

      {pedidos.length === 0 ? (
        <p className="py-20 text-center text-suave">Nenhum pedido encontrado.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {pedidos.map((p) => {
            const data = new Date(p.criadoEm).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              dateStyle: "short",
              timeStyle: "short",
            });
            return (
              <li
                key={p.id}
                className={`rounded-lg border border-linha p-4 ${p.status === "cancelado" ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">
                      Pedido {p.numero} <span className="text-sm font-normal text-suave">· {data}</span>
                    </p>
                    <p className="font-medium">{p.cliente.nome}</p>
                    <p className="text-sm text-suave">{formatarDocumento(p.cliente.documento)}</p>
                  </div>
                  <SeletorStatus id={p.id} status={p.status ?? "novo"} opcoes={statusPedido} />
                </div>

                <div className="mt-3 grid gap-1 text-sm sm:grid-cols-3">
                  <p>
                    <span className="text-suave">Peças:</span> {p.pecas} ·{" "}
                    <span className="font-semibold">{formatarPreco(p.total)}</span>
                    {p.cupom && <span className="text-sucesso"> · {p.cupom}</span>}
                  </p>
                  <p>
                    <span className="text-suave">Entrega:</span> {p.entrega.titulo}
                  </p>
                  <p>
                    <span className="text-suave">Cidade:</span> {p.endereco.cidade}/{p.endereco.uf}
                  </p>
                </div>

                {p.observacao && (
                  <p className="mt-2 rounded bg-creme px-3 py-2 text-sm">
                    <span className="text-suave">Obs.:</span> {p.observacao}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/55${p.cliente.telefone}?text=${encodeURIComponent(
                      `Olá, ${p.cliente.nome.split(" ")[0]}! Recebemos seu pedido ${p.numero} na Mar de Rosas.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md bg-sucesso px-3 py-2 text-sm font-semibold text-white"
                  >
                    <IconeWhatsapp className="size-4" /> {formatarTelefone(p.cliente.telefone)}
                  </a>
                  <Link
                    href={`/pedido/${p.id}`}
                    target="_blank"
                    className="rounded-md border border-linha px-3 py-2 text-sm font-semibold"
                  >
                    Ver pedido completo
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
