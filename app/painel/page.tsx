import type { Metadata } from "next";
import Link from "next/link";
import { AtualizarSozinho } from "@/components/AtualizarSozinho";
import { IconeWhatsapp } from "@/components/icones";
import { formatarDocumento, formatarPreco, formatarTelefone } from "@/lib/format";
import { listarPedidos, resumoConferencia, statusPedido, type StatusPedido } from "@/lib/pedidos";
import { AbasPainel } from "./AbasPainel";
import { bloqueioPainel, linkWhatsapp } from "./acesso";
import { SeletorStatus } from "./SeletorStatus";

export const metadata: Metadata = {
  title: "Painel — Mar de Rosas",
  robots: { index: false, follow: false },
};

export default async function Painel({ searchParams }: PageProps<"/painel">) {
  const bloqueio = await bloqueioPainel();
  if (bloqueio) return bloqueio;

  const { status: filtroStatus, busca: buscaParam, origem: origemParam } = await searchParams;
  const filtro = typeof filtroStatus === "string" && filtroStatus in statusPedido ? (filtroStatus as StatusPedido) : null;
  const busca = typeof buscaParam === "string" ? buscaParam.trim().toLowerCase() : "";
  const origem = origemParam === "loja" || origemParam === "revendedoras" ? origemParam : null;

  const todos = await listarPedidos();
  const contagem = Object.fromEntries(
    Object.keys(statusPedido).map((s) => [s, todos.filter((p) => (p.status ?? "novo") === s).length]),
  );

  const pedidos = todos.filter((p) => {
    if (filtro && (p.status ?? "novo") !== filtro) return false;
    if (origem === "loja" && p.revendedora) return false;
    if (origem === "revendedoras" && !p.revendedora) return false;
    if (!busca) return true;
    const alvo =
      `${p.numero} ${p.cliente.nome} ${p.cliente.documento} ${p.cliente.telefone} ${p.endereco.cidade} ${p.revendedora?.nome ?? ""}`.toLowerCase();
    return alvo.includes(busca.replace(/[.\-/()\s]/g, "")) || alvo.includes(busca);
  });
  const valorTotal = pedidos.filter((p) => p.status !== "cancelado").reduce((acc, p) => acc + (p.totalAtacado ?? p.total), 0);

  const linkFiltro = (mudanca: Record<string, string | null>) => {
    const q = new URLSearchParams();
    const atual = { status: filtro, busca: busca || null, origem, ...mudanca };
    for (const [k, v] of Object.entries(atual)) if (v) q.set(k, v);
    const qs = q.toString();
    return qs ? `/painel?${qs}` : "/painel";
  };

  return (
    <>
      <AbasPainel atual="/painel" />
      <AtualizarSozinho segundos={30} />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-5">
        <p className="text-sm text-suave">
          {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"} · {formatarPreco(valorTotal)}
          {filtro !== "cancelado" && " (sem cancelados, valor de atacado)"}
        </p>

        <form className="mt-3" action="/painel">
          {filtro && <input type="hidden" name="status" value={filtro} />}
          {origem && <input type="hidden" name="origem" value={origem} />}
          <input
            type="search"
            name="busca"
            defaultValue={busca}
            placeholder="Buscar por nº, nome, CPF/CNPJ, telefone, cidade ou revendedora"
            className="w-full rounded-md border border-linha px-4 py-2.5 outline-none focus:border-dourado"
          />
        </form>

        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <Link
            href={linkFiltro({ status: null })}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${!filtro ? "bg-texto text-white" : "bg-fundo"}`}
          >
            Todos ({todos.length})
          </Link>
          {Object.entries(statusPedido).map(([s, nome]) => (
            <Link
              key={s}
              href={linkFiltro({ status: s })}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${filtro === s ? "bg-texto text-white" : "bg-fundo"}`}
            >
              {nome} ({contagem[s]})
            </Link>
          ))}
        </nav>
        <nav className="mt-2 flex gap-2 text-sm">
          {[
            [null, "Todas as origens"],
            ["loja", "Loja (atacado)"],
            ["revendedoras", "Revendedoras"],
          ].map(([v, nome]) => (
            <Link
              key={nome}
              href={linkFiltro({ origem: v })}
              className={`rounded-full border px-3 py-1 ${origem === v ? "border-texto bg-texto text-white" : "border-linha"}`}
            >
              {nome}
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
              const conf = resumoConferencia(p);
              return (
                <li key={p.id} className={`rounded-lg border border-linha p-4 ${p.status === "cancelado" ? "opacity-60" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold">
                        Pedido {p.numero} <span className="text-sm font-normal text-suave">· {data}</span>
                      </p>
                      {p.revendedora && (
                        <p className="mt-0.5 inline-block rounded bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-900">
                          Revendedora: {p.revendedora.nome}
                        </p>
                      )}
                      <p className="font-medium">{p.cliente.nome}</p>
                      {p.cliente.documento && <p className="text-sm text-suave">{formatarDocumento(p.cliente.documento)}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <SeletorStatus id={p.id} status={p.status ?? "novo"} opcoes={statusPedido} />
                      {p.compraEnviadaMeta && <span className="text-xs text-sucesso">✓ Venda enviada ao Meta</span>}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-1 text-sm sm:grid-cols-3">
                    <p>
                      <span className="text-suave">Peças:</span> {p.pecas} ·{" "}
                      <span className="font-semibold">{formatarPreco(p.total)}</span>
                      {p.revendedora && p.totalAtacado !== undefined && (
                        <span className="text-suave"> (atacado {formatarPreco(p.totalAtacado)})</span>
                      )}
                      {p.cupom && <span className="text-sucesso"> · {p.cupom}</span>}
                    </p>
                    <p>
                      <span className="text-suave">Entrega:</span> {p.entrega.titulo}
                    </p>
                    <p>
                      <span className="text-suave">Cidade:</span> {p.endereco.cidade}/{p.endereco.uf}
                    </p>
                  </div>

                  <p className="mt-2 text-sm">
                    <span className="text-suave">Conferência:</span>{" "}
                    {conf.conferidos === 0 ? (
                      "não iniciada"
                    ) : (
                      <>
                        {conf.conferidos} de {conf.totalLinhas} itens
                        {conf.faltas > 0 && <span className="text-promo"> · {conf.faltas} em falta</span>}
                        {(p.substituicoes?.length ?? 0) > 0 && (
                          <span className="text-sky-800"> · {p.substituicoes!.length} substituição(ões)</span>
                        )}
                      </>
                    )}
                  </p>

                  {p.observacao && (
                    <p className="mt-2 rounded bg-creme px-3 py-2 text-sm">
                      <span className="text-suave">Obs.:</span> {p.observacao}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/painel/pedido/${p.id}`}
                      className="rounded-md bg-dourado-escuro px-3 py-2 text-sm font-semibold text-white"
                    >
                      Conferir pedido (✓ / ✕)
                    </Link>
                    <a
                      href={linkWhatsapp(
                        p.cliente.telefone,
                        `Olá, ${p.cliente.nome.split(" ")[0]}! Recebemos seu pedido ${p.numero} na Mar de Rosas.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md bg-sucesso px-3 py-2 text-sm font-semibold text-white"
                    >
                      <IconeWhatsapp className="size-4" /> Cliente {formatarTelefone(p.cliente.telefone)}
                    </a>
                    {p.revendedora && (
                      <a
                        href={linkWhatsapp(p.revendedora.whatsapp, `Olá, ${p.revendedora.nome.split(" ")[0]}! Sobre o pedido ${p.numero}:`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md border border-sucesso px-3 py-2 text-sm font-semibold text-sucesso"
                      >
                        <IconeWhatsapp className="size-4" /> Revendedora
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
