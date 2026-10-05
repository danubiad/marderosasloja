import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AtualizarSozinho } from "@/components/AtualizarSozinho";
import { ConferenciaPedido } from "@/components/ConferenciaPedido";
import { IconeWhatsapp } from "@/components/icones";
import { formatarCep, formatarPreco, formatarTelefone } from "@/lib/format";
import { buscarPedido, statusPedido } from "@/lib/pedidos";
import { revendedoraLogada } from "@/lib/revendedoras";
import { removerSubstituicaoRevendedora, substituirRevendedora } from "../../actions";

export const metadata: Metadata = {
  title: "Pedido — Revendedora Mar de Rosas",
  robots: { index: false, follow: false },
};

export default async function PedidoRevendedora({ params }: PageProps<"/revendedora/pedido/[id]">) {
  const r = await revendedoraLogada();
  if (!r) redirect("/revendedora");
  const { id } = await params;
  const p = await buscarPedido(id);
  if (!p || p.revendedora?.usuario !== r.usuario) notFound();
  const e = p.endereco;

  return (
    <>
      <AtualizarSozinho segundos={10} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-5">
        <Link href="/revendedora/painel" className="text-sm text-suave underline">
          ← Meus pedidos
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Pedido {p.numero}</h1>
            <p className="text-sm text-suave">{new Date(p.criadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
          </div>
          <span className="rounded-full bg-fundo px-3 py-1 text-sm font-semibold">{statusPedido[p.status ?? "novo"]}</span>
        </div>

        <p className="mt-4 rounded-md bg-creme px-4 py-3 text-sm">
          A loja marca cada peça na separação: <strong className="text-sucesso">✓</strong> separada,{" "}
          <strong className="text-promo">✕</strong> em falta. Esta página atualiza sozinha. Nas peças em falta, combine com sua
          cliente e toque em <strong>Substituir esta peça</strong>.
        </p>

        <section className="mt-4">
          <ConferenciaPedido
            pedido={p}
            modo="revendedora"
            substituir={substituirRevendedora.bind(null, p.id)}
            removerSubstituicao={removerSubstituicaoRevendedora.bind(null, p.id)}
          />
        </section>

        <div className="mt-4 rounded-md border border-linha p-4 text-sm">
          <div className="flex justify-between">
            <span>Total da cliente (original)</span>
            <span className="font-semibold">{formatarPreco(p.total)}</span>
          </div>
          {p.totalAtacado !== undefined && (
            <div className="mt-1 flex justify-between text-suave">
              <span>Você paga no atacado (original)</span>
              <span>{formatarPreco(p.totalAtacado)}</span>
            </div>
          )}
        </div>

        <section className="mt-4 rounded-md border border-linha p-4 text-sm">
          <h2 className="font-bold">Cliente</h2>
          <p className="mt-1">{p.cliente.nome}</p>
          <p className="text-suave">
            {e.logradouro}, {e.numero}
            {e.complemento && ` — ${e.complemento}`} · {e.bairro} · {e.cidade}/{e.uf} · CEP {formatarCep(e.cep)}
          </p>
          {p.observacao && <p className="mt-1">Obs.: {p.observacao}</p>}
          <a
            href={`https://wa.me/55${p.cliente.telefone}?text=${encodeURIComponent(`Olá, ${p.cliente.nome.split(" ")[0]}! Sobre seu pedido ${p.numero}:`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-sucesso px-3 py-2 font-semibold text-white"
          >
            <IconeWhatsapp className="size-4" /> {formatarTelefone(p.cliente.telefone)}
          </a>
        </section>
      </main>
    </>
  );
}
