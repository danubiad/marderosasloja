import type { Metadata } from "next";
import Link from "next/link";
import { IconeWhatsapp } from "@/components/icones";
import { listarClientes } from "@/lib/clientes";
import { formatarDocumento, formatarPreco, formatarTelefone } from "@/lib/format";
import { listarRevendedoras } from "@/lib/revendedoras";
import { AbasPainel } from "../AbasPainel";
import { bloqueioPainel, linkWhatsapp, momentoAtual, tempoAtras } from "../acesso";

export const metadata: Metadata = {
  title: "Clientes — Painel Mar de Rosas",
  robots: { index: false, follow: false },
};

const DIAS_SUMIDA = 45;
const DIA = 24 * 60 * 60 * 1000;

const filtros = {
  todas: "Todas",
  compraram: "Já compraram",
  nunca: "Nunca compraram",
  sumidas: `Sem comprar há ${DIAS_SUMIDA}+ dias`,
} as const;

export default async function Clientes({ searchParams }: PageProps<"/painel/clientes">) {
  const bloqueio = await bloqueioPainel();
  if (bloqueio) return bloqueio;

  const { filtro: filtroParam, busca: buscaParam } = await searchParams;
  const filtro = typeof filtroParam === "string" && filtroParam in filtros ? (filtroParam as keyof typeof filtros) : "todas";
  const busca = typeof buscaParam === "string" ? buscaParam.trim().toLowerCase() : "";
  const agora = momentoAtual();
  const [todas, revendedoras] = await Promise.all([listarClientes(), listarRevendedoras()]);
  const nomeRevendedora = Object.fromEntries(revendedoras.map((r) => [r.usuario, r.nome]));

  const sumida = (ultimoPedidoEm?: string) => Boolean(ultimoPedidoEm) && agora - Date.parse(ultimoPedidoEm!) >= DIAS_SUMIDA * DIA;
  const passa = (c: (typeof todas)[number]) => {
    if (filtro === "compraram" && c.pedidos.length === 0) return false;
    if (filtro === "nunca" && c.pedidos.length > 0) return false;
    if (filtro === "sumidas" && !sumida(c.ultimoPedidoEm)) return false;
    if (busca && !`${c.nome} ${c.telefone} ${c.documento ?? ""} ${c.cidade ?? ""}`.toLowerCase().includes(busca)) return false;
    return true;
  };
  const lista = todas.filter(passa);
  const contagem = {
    todas: todas.length,
    compraram: todas.filter((c) => c.pedidos.length > 0).length,
    nunca: todas.filter((c) => c.pedidos.length === 0).length,
    sumidas: todas.filter((c) => sumida(c.ultimoPedidoEm)).length,
  };

  return (
    <>
      <AbasPainel atual="/painel/clientes" />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-5">
        <form action="/painel/clientes">
          {filtro !== "todas" && <input type="hidden" name="filtro" value={filtro} />}
          <input
            type="search"
            name="busca"
            defaultValue={busca}
            placeholder="Buscar por nome, WhatsApp, CPF/CNPJ ou cidade"
            className="w-full rounded-md border border-linha px-4 py-2.5 outline-none focus:border-dourado"
          />
        </form>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {(Object.keys(filtros) as (keyof typeof filtros)[]).map((f) => (
            <Link
              key={f}
              href={f === "todas" ? "/painel/clientes" : `/painel/clientes?filtro=${f}`}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${filtro === f ? "bg-texto text-white" : "bg-fundo"}`}
            >
              {filtros[f]} ({contagem[f]})
            </Link>
          ))}
        </nav>

        {lista.length === 0 ? (
          <p className="py-20 text-center text-suave">Nenhuma cliente encontrada.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {lista.map((c) => {
              const primeiroNome = c.nome.split(" ")[0];
              const mensagem = sumida(c.ultimoPedidoEm)
                ? `Oi, ${primeiroNome}! Que saudade! Chegaram novidades na Mar de Rosas, quer ver?`
                : `Olá, ${primeiroNome}! Aqui é da Mar de Rosas Lingerie.`;
              return (
                <li key={c.id} className="rounded-lg border border-linha p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{c.nome || "Sem nome"}</p>
                      <p className="text-sm text-suave">{formatarTelefone(c.telefone)}</p>
                    </div>
                    {sumida(c.ultimoPedidoEm) && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">Sumida</span>
                    )}
                  </div>
                  {c.revendedora && (
                    <p className="mt-1 inline-block rounded bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-900">
                      Cliente de {nomeRevendedora[c.revendedora] ?? c.revendedora}
                    </p>
                  )}
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <dt className="text-suave">Pedidos</dt>
                    <dd>
                      {c.pedidos.length} · {formatarPreco(c.totalGasto)}
                    </dd>
                    <dt className="text-suave">Último pedido</dt>
                    <dd>{c.ultimoPedidoEm ? tempoAtras(c.ultimoPedidoEm, agora) : "nunca"}</dd>
                    <dt className="text-suave">Último acesso</dt>
                    <dd>{tempoAtras(c.ultimoAcesso, agora)}</dd>
                    {c.cidade && (
                      <>
                        <dt className="text-suave">Cidade</dt>
                        <dd>
                          {c.cidade}/{c.uf}
                        </dd>
                      </>
                    )}
                    {c.documento && (
                      <>
                        <dt className="text-suave">CPF/CNPJ</dt>
                        <dd>{formatarDocumento(c.documento)}</dd>
                      </>
                    )}
                  </dl>
                  <a
                    href={linkWhatsapp(c.telefone, mensagem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 rounded-md bg-sucesso px-3 py-2 text-sm font-semibold text-white"
                  >
                    <IconeWhatsapp className="size-4" /> Chamar no WhatsApp
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
