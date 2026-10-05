import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { FotoProduto } from "@/components/FotoProduto";
import { GradeQuantidade } from "@/components/GradeQuantidade";
import { IconeCheck, IconeWhatsapp } from "@/components/icones";
import { Resumo } from "@/components/Resumo";
import { loja } from "@/lib/config";
import { formatarCep, formatarPreco, formatarTelefone, mascararDocumento } from "@/lib/format";
import { buscarPedido } from "@/lib/pedidos";
import { LojaProvider } from "@/lib/loja";
import { AtualizarSozinho } from "@/components/AtualizarSozinho";
import { ConferenciaPedido } from "@/components/ConferenciaPedido";

export const metadata: Metadata = {
  title: `Pedido — ${loja.nome}`,
  robots: { index: false, follow: false },
};

export default async function PaginaPedido({ params, searchParams }: PageProps<"/pedido/[id]">) {
  const { id } = await params;
  const { enviado } = await searchParams;
  const pedido = await buscarPedido(id);
  if (!pedido) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocolo = h.get("x-forwarded-proto") ?? "https";
  const link = `${protocolo}://${host}/pedido/${pedido.id}`;

  const mensagem = [
    `Olá! Acabei de fazer o *Pedido ${pedido.numero}* no catálogo.`,
    "",
    `Nome: ${pedido.cliente.nome}`,
    `Peças: ${pedido.pecas}`,
    `Total: ${formatarPreco(pedido.total)}`,
    `Entrega: ${pedido.entrega.titulo}`,
    "",
    `Conferência do pedido: ${link}`,
  ].join("\n");
  const destino = pedido.revendedora ? `55${pedido.revendedora.whatsapp}` : loja.whatsapp;
  const linkWhatsapp = `https://wa.me/${destino}?text=${encodeURIComponent(mensagem)}`;
  const conferenciaIniciada = Object.keys(pedido.conferencia ?? {}).length > 0;
  const voltar = pedido.revendedora ? `/r/${pedido.revendedora.usuario}` : "/";

  const data = new Date(pedido.criadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const e = pedido.endereco;

  return (
    <LojaProvider revendedora={pedido.revendedora}>
      <AtualizarSozinho segundos={30} />
      <Cabecalho titulo={`Pedido ${pedido.numero}`} semCarrinho />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-6">
        {enviado && (
          <section className="mb-10 flex flex-col items-center text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-sucesso text-white">
              <IconeCheck className="size-10" />
            </div>
            <h1 className="mt-6 text-2xl font-bold">Seu pedido foi enviado.</h1>
            <p className="mt-4 max-w-md text-lg">
              {pedido.revendedora
                ? `Agora envie o pedido no WhatsApp de ${pedido.revendedora.nome} para finalizar a compra.`
                : "Agora envie o pedido no WhatsApp da loja para que uma de nossas vendedoras finalize com você."}
              Obrigada pela preferência!
            </p>
            <a
              href={linkWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full max-w-md items-center justify-center gap-2 rounded-md bg-sucesso px-6 py-4 text-lg font-bold text-white"
            >
              <IconeWhatsapp className="size-6" /> Enviar pedido no WhatsApp
            </a>
          </section>
        )}

        <div className="flex items-center justify-between text-sm text-suave">
          <span>Pedido {pedido.numero}</span>
          <span>{data}</span>
        </div>

        {conferenciaIniciada ? (
          <div className="mt-4">
            <ConferenciaPedido pedido={pedido} modo="cliente" />
          </div>
        ) : (
        <ul className="mt-4 divide-y divide-linha">
          {pedido.itens.map((item) => (
            <li key={item.produtoId} className="py-6 first:pt-2">
              <div className="mb-3 flex items-center gap-4">
                <FotoProduto src={item.foto} alt={item.nome} cores={item.cores} sizes="96px" className="h-28 w-22 shrink-0" />
                <div>
                  <h2 className="font-bold uppercase">{item.nome}</h2>
                  <p className="text-sm text-suave">{item.referencia}</p>
                  <p className="mt-1 font-semibold">{formatarPreco(item.preco)}</p>
                </div>
              </div>
              <GradeQuantidade
                cores={item.cores}
                tamanhos={item.tamanhos}
                legendas={item.legendaTamanhos}
                grade={item.grade}
                somenteComQuantidade
              />
              <div className="mt-4 flex justify-between">
                <span>{item.pecas} pç.</span>
                <span>{formatarPreco(item.subtotal)}</span>
              </div>
            </li>
          ))}
        </ul>
        )}

        <Resumo
          pecas={pedido.pecas}
          subtotal={pedido.subtotal}
          desconto={pedido.desconto}
          cupom={pedido.cupom}
          entrega={pedido.entrega}
          total={pedido.total}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <section className="rounded-md border border-linha p-5">
            <h2 className="text-lg font-bold">Cliente</h2>
            <p className="mt-2 text-suave">{pedido.cliente.nome}</p>
            {pedido.cliente.documento && <p className="text-suave">{mascararDocumento(pedido.cliente.documento)}</p>}
            <p className="text-suave">{formatarTelefone(pedido.cliente.telefone)}</p>
          </section>
          <section className="rounded-md border border-linha p-5">
            <h2 className="text-lg font-bold">Entrega</h2>
            <p className="mt-2 font-medium">{pedido.entrega.titulo}</p>
            <p className="text-suave">
              {e.logradouro}, {e.numero}
              {e.complemento && ` — ${e.complemento}`}
            </p>
            <p className="text-suave">
              {e.bairro} · {e.cidade}/{e.uf} · CEP {formatarCep(e.cep)}
            </p>
          </section>
        </div>

        {pedido.observacao && (
          <section className="mt-4 rounded-md border border-linha p-5">
            <h2 className="text-lg font-bold">Observação</h2>
            <p className="mt-2 whitespace-pre-line text-suave">{pedido.observacao}</p>
          </section>
        )}

        <Link href={voltar} className="mt-8 block rounded-md bg-texto px-6 py-4 text-center text-lg font-bold text-white">
          Voltar ao catálogo
        </Link>
      </main>
    </LojaProvider>
  );
}
