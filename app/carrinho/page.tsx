"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BarraTotal } from "@/components/BarraTotal";
import { Cabecalho } from "@/components/Cabecalho";
import { FotoProduto } from "@/components/FotoProduto";
import { GradeQuantidade } from "@/components/GradeQuantidade";
import { IconeEscudo, IconeLixeira, IconeWhatsapp } from "@/components/icones";
import { Resumo } from "@/components/Resumo";
import { calcularResumo } from "@/lib/calculo";
import { useCarrinho } from "@/lib/carrinho";
import { buscarCupom, loja, pedidoMinimo } from "@/lib/config";
import { formatarPreco } from "@/lib/format";

export default function PaginaCarrinho() {
  const router = useRouter();
  const { itens, carregado, cupom, observacao, definirGrade, remover, setCupom, setObservacao } = useCarrinho();
  const [codigo, setCodigo] = useState(cupom);
  const [erroCupom, setErroCupom] = useState("");
  const resumo = calcularResumo(itens, cupom);
  const faltaMinimo = pedidoMinimo - resumo.subtotal;

  function aplicarCupom() {
    if (!codigo.trim()) {
      setCupom("");
      setErroCupom("");
      return;
    }
    const encontrado = buscarCupom(codigo);
    if (encontrado) {
      setCupom(encontrado.codigo);
      setCodigo(encontrado.codigo);
      setErroCupom("");
    } else {
      setErroCupom("Cupom inválido.");
    }
  }

  return (
    <>
      <Cabecalho voltar titulo="Seu Carrinho" semCarrinho />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-40 pt-6">
        {!carregado ? null : resumo.linhas.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-suave">Seu carrinho está vazio.</p>
            <Link href="/" className="mt-6 inline-block rounded-md bg-texto px-6 py-3 font-semibold text-white">
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-linha">
              {resumo.linhas.map(({ produto, grade, pecas, subtotal }) => (
                <li key={produto.id} className="py-6 first:pt-0">
                  <div className="mb-3 flex items-center gap-4">
                    <Link href={`/produto/${produto.slug}`} className="shrink-0">
                      <FotoProduto
                        src={produto.fotos[0]}
                        alt={produto.nome}
                        cores={produto.cores}
                        sizes="96px"
                        className="h-28 w-22"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold uppercase">{produto.nome}</h2>
                      <p className="text-sm text-suave">{produto.referencia}</p>
                      <p className="mt-1 font-semibold">{formatarPreco(produto.preco)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remover(produto.id)}
                      className="rounded-full p-2 hover:bg-fundo"
                      aria-label={`Remover ${produto.nome}`}
                    >
                      <IconeLixeira />
                    </button>
                  </div>
                  <GradeQuantidade
                    cores={produto.cores}
                    tamanhos={produto.tamanhos}
                    grade={grade}
                    onChange={(g) => definirGrade(produto.id, g)}
                    somenteComQuantidade
                  />
                  <div className="mt-4 flex justify-between">
                    <span>{pecas} pç.</span>
                    <span>{formatarPreco(subtotal)}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-2 border-t border-linha pt-6">
              <div className="flex gap-3">
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && aplicarCupom()}
                  placeholder="Cupom de desconto"
                  className="min-w-0 flex-1 rounded-md border border-linha px-4 py-3 text-lg"
                />
                <button type="button" onClick={aplicarCupom} className="rounded-md bg-texto px-5 text-lg font-bold text-white">
                  Aplicar
                </button>
              </div>
              {erroCupom && <p className="mt-2 text-sm text-promo">{erroCupom}</p>}
              {resumo.cupom && (
                <p className="mt-2 text-sm text-sucesso">
                  Cupom {resumo.cupom.codigo} aplicado: {resumo.cupom.percentual}% de desconto.
                </p>
              )}
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Adicionar observação"
                rows={2}
                className="mt-4 w-full rounded-md border border-linha px-4 py-3 text-lg"
              />
            </div>

            <section className="mt-6 border-t border-linha pt-6">
              <h2 className="text-xl font-bold">Vendedora</h2>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-creme font-serif text-2xl text-dourado-escuro ring-1 ring-dourado-claro">
                  MR
                </div>
                <div>
                  <p className="font-semibold">{loja.vendedora}</p>
                  <a
                    href={`https://wa.me/${loja.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-2 font-medium underline"
                  >
                    <IconeWhatsapp className="size-6 text-sucesso" /> {loja.whatsappExibicao}
                  </a>
                </div>
              </div>
            </section>

            <div className="mt-6">
              <Resumo
                pecas={resumo.pecas}
                subtotal={resumo.subtotal}
                desconto={resumo.desconto}
                cupom={resumo.cupom?.codigo}
                total={resumo.total}
              />
            </div>

            <p className="mt-6 flex items-center justify-center gap-2 font-medium uppercase text-suave">
              <IconeEscudo className="size-5 text-sucesso" /> Compra segura e garantida
            </p>
          </>
        )}
      </main>

      {carregado && resumo.linhas.length > 0 && (
        <BarraTotal
          total={resumo.total}
          rotulo="Continuar"
          desabilitado={faltaMinimo > 0}
          aviso={
            faltaMinimo > 0
              ? `Pedido mínimo de ${formatarPreco(pedidoMinimo)}. Faltam ${formatarPreco(faltaMinimo)}.`
              : undefined
          }
          onClick={() => router.push("/finalizar")}
        />
      )}
    </>
  );
}
