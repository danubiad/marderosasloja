"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BolinhaCor } from "@/components/BolinhaCor";
import { FotoProduto } from "@/components/FotoProduto";
import { GradeQuantidade } from "@/components/GradeQuantidade";
import { IconeCarrinho } from "@/components/icones";
import type { Produto } from "@/data/produtos";
import { totalPecas } from "@/lib/calculo";
import { useCarrinho } from "@/lib/carrinho";
import { formatarPreco } from "@/lib/format";

export function ProdutoDetalhe({ produto }: { produto: Produto }) {
  const { itens, definirGrade } = useCarrinho();
  const grade = itens[produto.id] ?? {};
  const pecas = totalPecas(grade);

  // Galeria: fotos gerais + fotos por cor
  const fotosCores = produto.cores.filter((c) => c.foto);
  const slides = [
    ...(produto.fotos.length ? produto.fotos : [undefined]).map((src) => ({ src, cor: undefined as string | undefined })),
    ...fotosCores.map((c) => ({ src: c.foto, cor: c.nome })),
  ];
  const [slideAtual, setSlideAtual] = useState(0);
  const galeria = useRef<HTMLDivElement>(null);

  function irPara(indice: number) {
    const el = galeria.current;
    if (el) el.scrollTo({ left: indice * el.clientWidth, behavior: "smooth" });
  }

  async function compartilhar() {
    const dados = { title: produto.nome, text: `${produto.nome} — ${formatarPreco(produto.preco)}`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(dados);
      else await navigator.clipboard.writeText(dados.url);
    } catch {}
  }

  return (
    <div className="mx-auto max-w-5xl md:grid md:grid-cols-2 md:gap-8 md:px-4 md:py-6">
      <div className="md:sticky md:top-20 md:self-start">
        <div
          ref={galeria}
          onScroll={(e) => setSlideAtual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
        >
          {slides.map((s, i) => (
            <FotoProduto
              key={i}
              src={s.src}
              alt={s.cor ? `${produto.nome} — ${s.cor}` : produto.nome}
              cores={produto.cores}
              priority={i === 0}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="aspect-[4/5] w-full shrink-0 snap-center"
            />
          ))}
        </div>
        {slides.length > 1 && (
          <div className="flex justify-center gap-2 py-3">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => irPara(i)}
                className={`size-2.5 rounded-full border border-suave ${i === slideAtual ? "bg-suave" : ""}`}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
        )}

        {produto.cores.length > 0 && (
          <div className="flex gap-4 overflow-x-auto bg-fundo px-4 py-3">
            {produto.cores.map((c) => {
              const indice = slides.findIndex((s) => s.cor === c.nome);
              return (
                <button
                  key={c.nome}
                  type="button"
                  disabled={indice < 0}
                  onClick={() => irPara(indice)}
                  className="flex w-16 shrink-0 flex-col items-center gap-1 disabled:cursor-default"
                >
                  <BolinhaCor hex={c.hex} className="size-12" />
                  <span className="w-full truncate text-center text-xs">{c.nome}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 pb-10 pt-5 md:px-0 md:pt-0">
        <p className="text-right text-3xl font-bold">
          {produto.precoDe && (
            <span className="mr-2 text-base font-normal text-suave line-through">{formatarPreco(produto.precoDe)}</span>
          )}
          {formatarPreco(produto.preco)}
        </p>
        <div className="mt-2 flex items-start gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold uppercase leading-tight">{produto.nome}</h1>
            <p className="mt-1 text-sm text-suave">{produto.referencia}</p>
          </div>
          <button type="button" onClick={compartilhar} className="rounded-full p-2 hover:bg-fundo" aria-label="Compartilhar">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
              <circle cx="18" cy="5" r="2.5" />
              <circle cx="6" cy="12" r="2.5" />
              <circle cx="18" cy="19" r="2.5" />
              <path d="m8.2 10.8 7.6-4.4m-7.6 6.8 7.6 4.4" />
            </svg>
          </button>
        </div>

        <p className="mt-4 uppercase leading-relaxed text-suave">{produto.descricao}</p>

        {pecas === 0 && (
          <div className="mt-6 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-center text-orange-600">
            <strong>ATENÇÃO!</strong> Aperte no + para incluir a quantidade de peças desejadas.
          </div>
        )}

        <div className="mt-6">
          <GradeQuantidade
            cores={produto.cores}
            tamanhos={produto.tamanhos}
            grade={grade}
            onChange={(g) => definirGrade(produto.id, g)}
            permitirDigitar
          />
        </div>

        <div className="mt-6 flex justify-between">
          <span>{pecas} pç.</span>
          <span className="font-semibold">{formatarPreco(pecas * produto.preco)}</span>
        </div>

        <div className="mt-6 grid gap-3">
          {pecas > 0 && (
            <Link
              href="/carrinho"
              className="flex items-center justify-center gap-2 rounded-md bg-dourado-escuro px-4 py-3.5 text-lg font-bold text-white"
            >
              Ver carrinho
            </Link>
          )}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-md border-2 border-texto px-4 py-3 text-lg font-bold text-texto"
          >
            <IconeCarrinho className="size-6" /> Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
