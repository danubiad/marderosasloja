import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AtualizarSozinho } from "@/components/AtualizarSozinho";
import { BotaoCompartilhar } from "@/components/BotaoCompartilhar";
import { ConferenciaPedido } from "@/components/ConferenciaPedido";
import { Resumo } from "@/components/Resumo";
import { loja } from "@/lib/config";
import { formatarCep, formatarDocumento, formatarPreco, formatarTelefone } from "@/lib/format";
import { buscarCustos, buscarDisponibilidade } from "@/lib/estoque";
import { buscarPedido, custoDoPedido, resumoConferencia, statusPedido } from "@/lib/pedidos";
import { marcarItemLoja, removerSubstituicaoLoja, substituirLoja } from "../../actions";
import { AbasPainel } from "../../AbasPainel";
import { bloqueioPainel } from "../../acesso";
import { SeletorStatus } from "../../SeletorStatus";

export const metadata: Metadata = {
  title: "Conferir pedido — Mar de Rosas",
  robots: { index: false, follow: false },
};

export default async function ConferirPedido({ params }: PageProps<"/painel/pedido/[id]">) {
  const bloqueio = await bloqueioPainel();
  if (bloqueio) return bloqueio;

  const { id } = await params;
  const p = await buscarPedido(id);
  if (!p) notFound();
  const e = p.endereco;

  // Só no painel: custo das peças, venda e lucro do pedido
  const conf = resumoConferencia(p);
  const { custo, semCusto } = custoDoPedido(p, await buscarCustos());
  const venda = p.revendedora ? conf.atacado : conf.subtotal - conf.desconto;
  const lucro = venda - custo;

  return (
    <>
      <AbasPainel atual="/painel" />
      <AtualizarSozinho segundos={15} />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-5">
        <Link href="/painel" className="text-sm text-suave underline">
          ← Todos os pedidos
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Pedido {p.numero}</h1>
            <p className="text-sm text-suave">
              {new Date(p.criadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            </p>
            {p.revendedora && (
              <p className="mt-1 inline-block rounded bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-900">
                Revendedora: {p.revendedora.nome} · margem {p.revendedora.margem}%
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <SeletorStatus id={p.id} status={p.status ?? "novo"} opcoes={statusPedido} />
            {p.compraEnviadaMeta && <span className="text-xs text-sucesso">✓ Venda enviada ao Meta</span>}
          </div>
        </div>

        <p className="mt-4 rounded-md bg-creme px-4 py-3 text-sm">
          Marque cada peça: <strong className="text-sucesso">✓</strong> quando separar e{" "}
          <strong className="text-promo">✕</strong> se estiver em falta.
          {p.revendedora
            ? " A revendedora vê as marcas em tempo real no cadastro dela e pode escolher a substituição."
            : " Nas peças em falta, você pode registrar a substituição combinada com a cliente."}{" "}
          A cliente também pode escolher a troca pelo link do pedido (até o pedido ser enviado).
        </p>

        <section className="mt-4">
          <ConferenciaPedido
            pedido={p}
            modo="loja"
            disponibilidade={await buscarDisponibilidade()}
            marcar={marcarItemLoja.bind(null, p.id)}
            substituir={substituirLoja.bind(null, p.id)}
            removerSubstituicao={removerSubstituicaoLoja.bind(null, p.id)}
          />
        </section>

        <div className="mt-6">
          <Resumo
            pecas={p.pecas}
            subtotal={p.subtotal}
            desconto={p.desconto}
            cupom={p.cupom}
            entrega={p.entrega}
            total={p.total}
          />
          {p.revendedora && p.totalAtacado !== undefined && (
            <p className="mt-1 text-right text-sm text-suave">Valor original no atacado: {formatarPreco(p.totalAtacado)}</p>
          )}
        </div>

        <section className="mt-4 rounded-md border border-linha bg-creme p-4">
          <h2 className="font-bold">Custo e lucro</h2>
          <dl className="mt-2 grid gap-1 text-sm">
            <div className="flex justify-between">
              <dt>Custo total das peças</dt>
              <dd>{formatarPreco(custo)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{p.revendedora ? "Venda (atacado, o que a revendedora paga)" : "Venda (sem o frete)"}</dt>
              <dd>{formatarPreco(venda)}</dd>
            </div>
            <div className={`flex justify-between border-t border-linha pt-1 text-base font-bold ${lucro < 0 ? "text-promo" : "text-sucesso"}`}>
              <dt>Lucro</dt>
              <dd>
                {formatarPreco(lucro)}
                {venda > 0 && <span className="ml-1 text-xs font-normal">({Math.round((lucro / venda) * 100)}%)</span>}
              </dd>
            </div>
          </dl>
          {semCusto > 0 && (
            <p className="mt-2 text-xs text-promo">
              {semCusto} {semCusto === 1 ? "peça é" : "peças são"} de produtos sem preço de custo: cadastre na aba{" "}
              <Link href="/painel/produtos" className="underline">
                Produtos
              </Link>{" "}
              para o lucro ficar certo.
            </p>
          )}
          <p className="mt-1 text-xs text-suave">Peças em falta não entram; as substituições entram. Usa o custo cadastrado hoje.</p>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <section className="rounded-md border border-linha p-4 text-sm">
            <h2 className="font-bold">Cliente</h2>
            <p className="mt-1">{p.cliente.nome}</p>
            {p.cliente.documento && <p className="text-suave">{formatarDocumento(p.cliente.documento)}</p>}
            <p className="text-suave">{formatarTelefone(p.cliente.telefone)}</p>
          </section>
          <section className="rounded-md border border-linha p-4 text-sm">
            <h2 className="font-bold">Entrega: {p.entrega.titulo}</h2>
            <p className="mt-1 text-suave">
              {e.logradouro}, {e.numero}
              {e.complemento && ` — ${e.complemento}`}
            </p>
            <p className="text-suave">
              {e.bairro} · {e.cidade}/{e.uf} · CEP {formatarCep(e.cep)}
            </p>
          </section>
        </div>
        {p.observacao && (
          <p className="mt-4 rounded-md border border-linha p-4 text-sm">
            <strong>Observação:</strong> {p.observacao}
          </p>
        )}
        <div className="mt-4">
          <BotaoCompartilhar
            titulo={`Pedido ${p.numero}`}
            texto={`Olá, ${p.cliente.nome.split(" ")[0]}! Este é o seu pedido ${p.numero}:\nhttps://${loja.dominio}/pedido/${p.id}`}
          />
        </div>
      </main>
    </>
  );
}
