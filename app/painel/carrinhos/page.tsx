import type { Metadata } from "next";
import Link from "next/link";
import { AtualizarSozinho } from "@/components/AtualizarSozinho";
import { BolinhaCor } from "@/components/BolinhaCor";
import { BotaoCompartilhar } from "@/components/BotaoCompartilhar";
import { FotoProduto } from "@/components/FotoProduto";
import { IconeWhatsapp } from "@/components/icones";
import { calcularResumo, type LinhaResumo } from "@/lib/calculo";
import { listarCarrinhos, situacaoCarrinho, type SituacaoCarrinho } from "@/lib/clientes";
import { loja } from "@/lib/config";
import { buscarDisponibilidade } from "@/lib/estoque";
import { formatarPreco, formatarTelefone } from "@/lib/format";
import { listarRevendedoras } from "@/lib/revendedoras";
import { AbasPainel } from "../AbasPainel";
import { bloqueioPainel, linkWhatsapp, momentoAtual, tempoAtras } from "../acesso";

export const metadata: Metadata = {
  title: "Carrinhos — Painel Mar de Rosas",
  robots: { index: false, follow: false },
};

const situacoes: Record<SituacaoCarrinho, { nome: string; cor: string }> = {
  navegando: { nome: "Navegando agora", cor: "bg-green-100 text-green-900" },
  parado: { nome: "Parou há pouco", cor: "bg-amber-100 text-amber-900" },
  abandonado: { nome: "Abandonado", cor: "bg-red-100 text-red-900" },
  finalizado: { nome: "Virou pedido", cor: "bg-sky-100 text-sky-900" },
  vazio: { nome: "Carrinho vazio", cor: "bg-neutral-100 text-neutral-600" },
};

export default async function Carrinhos({ searchParams }: PageProps<"/painel/carrinhos">) {
  const bloqueio = await bloqueioPainel();
  if (bloqueio) return bloqueio;

  const { situacao } = await searchParams;
  const agora = momentoAtual();
  const [todos, revendedoras, disponibilidade] = await Promise.all([
    listarCarrinhos(),
    listarRevendedoras(),
    buscarDisponibilidade(),
  ]);
  const nomeRevendedora = Object.fromEntries(revendedoras.map((r) => [r.usuario, r.nome]));
  const margemRevendedora = Object.fromEntries(revendedoras.map((r) => [r.usuario, r.margem]));
  const comSituacao = todos.map((c) => ({ ...c, situacao: situacaoCarrinho(c, agora) }));
  const filtro = typeof situacao === "string" && situacao in situacoes ? (situacao as SituacaoCarrinho) : null;
  // Por padrão mostra só os carrinhos com peças (os que ainda podem virar pedido)
  const lista = comSituacao.filter((c) => (filtro ? c.situacao === filtro : ["navegando", "parado", "abandonado"].includes(c.situacao)));
  const contagem = (s: SituacaoCarrinho) => comSituacao.filter((c) => c.situacao === s).length;
  const emAberto = comSituacao.filter((c) => ["navegando", "parado", "abandonado"].includes(c.situacao));

  return (
    <>
      <AbasPainel atual="/painel/carrinhos" />
      <AtualizarSozinho segundos={20} />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-5">
        <p className="text-sm text-suave">
          {emAberto.length} carrinhos em aberto · {formatarPreco(emAberto.reduce((a, c) => a + c.valor, 0))} em peças. A situação
          atualiza sozinha.
        </p>

        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <Link
            href="/painel/carrinhos"
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${!filtro ? "bg-texto text-white" : "bg-fundo"}`}
          >
            Em aberto ({emAberto.length})
          </Link>
          {(Object.keys(situacoes) as SituacaoCarrinho[]).map((s) => (
            <Link
              key={s}
              href={`/painel/carrinhos?situacao=${s}`}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${filtro === s ? "bg-texto text-white" : "bg-fundo"}`}
            >
              {situacoes[s].nome} ({contagem(s)})
            </Link>
          ))}
        </nav>

        {lista.length === 0 ? (
          <p className="py-20 text-center text-suave">Nenhum carrinho nesta situação.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {lista.map((c) => {
              const primeiroNome = c.nome.split(" ")[0];
              const margem = c.revendedora ? margemRevendedora[c.revendedora] : undefined;
              const { linhas, pecas, subtotal } = calcularResumo(c.itens ?? {}, {
                revendedora: margem !== undefined ? { margem } : undefined,
                disponibilidade,
              });
              const catalogo = `https://${loja.dominio}${c.revendedora ? `/r/${c.revendedora}` : ""}`;
              const mensagem =
                c.situacao === "finalizado"
                  ? `Olá, ${primeiroNome}! Obrigada pelo pedido ${c.pedidoNumero ?? ""} na ${loja.vendedora}.`
                  : linhas.length > 0
                    ? mensagemCarrinho(primeiroNome, linhas, pecas, subtotal, catalogo)
                    : `Olá, ${primeiroNome}! Vi que você separou peças no nosso catálogo. Posso te ajudar a finalizar o pedido?`;
              return (
                <li key={c.id} className="rounded-lg border border-linha p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold">{c.nome || "Sem nome"}</p>
                      <p className="text-sm text-suave">{formatarTelefone(c.telefone)}</p>
                      {c.revendedora && (
                        <p className="mt-0.5 inline-block rounded bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-900">
                          Catálogo de {nomeRevendedora[c.revendedora] ?? c.revendedora}
                        </p>
                      )}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${situacoes[c.situacao].cor}`}>
                      {situacoes[c.situacao].nome}
                    </span>
                  </div>

                  <p className="mt-2 text-sm">
                    <span className="font-semibold">{c.pecas} peças</span> · {formatarPreco(c.valor)}
                    <span className="text-suave">
                      {" "}
                      · mexeu no carrinho {tempoAtras(c.atualizadoEm, agora)} · visto {tempoAtras(c.vistoEm, agora)}
                    </span>
                  </p>
                  {linhas.length > 0 ? (
                    <details className="mt-2 rounded-md border border-linha">
                      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">
                        Ver peças do carrinho ({linhas.length} {linhas.length === 1 ? "produto" : "produtos"})
                      </summary>
                      <ListaCarrinho linhas={linhas} />
                    </details>
                  ) : (
                    c.resumo.length > 0 && <p className="mt-1 text-sm text-suave">{c.resumo.join(" · ")}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={linkWhatsapp(c.telefone, mensagem)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md bg-sucesso px-3 py-2 text-sm font-semibold text-white"
                    >
                      <IconeWhatsapp className="size-4" /> Chamar no WhatsApp
                    </a>
                    <BotaoCompartilhar titulo={`Carrinho de ${primeiroNome}`} texto={mensagem} />
                    {c.pedidoId && (
                      <Link href={`/painel/pedido/${c.pedidoId}`} className="rounded-md border border-linha px-3 py-2 text-sm font-semibold">
                        Ver pedido {c.pedidoNumero}
                      </Link>
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

/** Peças do carrinho no mesmo jeito da conferência do pedido: foto, nome e cada cor/tamanho com a quantidade. */
function ListaCarrinho({ linhas }: { linhas: LinhaResumo[] }) {
  return (
    <ul className="divide-y divide-linha px-3">
      {linhas.map((l) => (
        <li key={l.produto.id} className="py-4">
          <div className="mb-2 flex items-center gap-3">
            <FotoProduto
              src={l.produto.fotos[0]}
              alt={l.produto.nome}
              cores={l.produto.cores}
              sizes="64px"
              className="h-20 w-16 shrink-0 rounded"
            />
            <div className="min-w-0">
              <h3 className="font-bold uppercase leading-tight">{l.produto.nome}</h3>
              <p className="text-sm text-suave">
                {l.produto.referencia} · {formatarPreco(l.preco)} · {l.pecas} peças · {formatarPreco(l.subtotal)}
              </p>
            </div>
          </div>
          <ul className="grid gap-1">
            {Object.entries(l.grade).map(([cg, q]) => {
              const [cor, tamanho] = cg.split("|");
              const corInfo = l.produto.cores.find((c) => c.nome === cor);
              return (
                <li key={cg} className="flex items-center gap-3 px-2 py-1">
                  <BolinhaCor hex={corInfo?.hex ?? "#ccc"} amostra={corInfo?.amostra} className="size-7" />
                  <span className="min-w-0 flex-1 text-sm">
                    {cor} · {tamanho}
                    {l.produto.legendaTamanhos?.[tamanho] ? ` (${l.produto.legendaTamanhos[tamanho]})` : ""}
                  </span>
                  <span className="w-10 text-right font-semibold">×{q}</span>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

/** Texto do WhatsApp com a lista do carrinho, para a cliente ver o que separou. */
function mensagemCarrinho(primeiroNome: string, linhas: LinhaResumo[], pecas: number, subtotal: number, catalogo: string) {
  return [
    `Olá, ${primeiroNome}! Vi que você separou estas peças no catálogo da ${loja.vendedora}:`,
    "",
    ...linhas.flatMap((l) => [
      `*${l.produto.nome}* (${l.produto.referencia})`,
      ...Object.entries(l.grade).map(([cg, q]) => {
        const [cor, tamanho] = cg.split("|");
        return `• ${cor} · ${tamanho} ×${q}`;
      }),
      "",
    ]),
    `Total: ${pecas} peças · ${formatarPreco(subtotal)}`,
    "",
    "Posso te ajudar a finalizar o pedido?",
    `Catálogo: ${catalogo}`,
  ].join("\n");
}
