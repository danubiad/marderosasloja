"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ItemFeed } from "@/components/FeedVideos";
import { useLoja } from "@/lib/loja";
import { formatarPreco } from "@/lib/format";

/**
 * Fileira de vídeos embaixo da vitrine. O vídeo do meio fica maior e é o único que toca (sem som);
 * quando ele acaba, passa para o próximo. Tocar no vídeo do meio abre o feed de vídeos (o mesmo do botão de play);
 * tocar num vídeo do lado traz ele para o meio.
 */
export function VideosEmDestaque({ itens }: { itens: ItemFeed[] }) {
  const { base } = useLoja();
  const trilho = useRef<HTMLUListElement>(null);
  const [ativo, setAtivo] = useState(0);
  const [visivel, setVisivel] = useState(false);

  // Só toca quando a fileira aparece na tela
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const observer = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Toca o vídeo do meio e pausa os outros
  useEffect(() => {
    trilho.current?.querySelectorAll("video").forEach((v, i) => {
      if (i === ativo && visivel) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [ativo, visivel]);

  function centralizar(i: number) {
    const el = trilho.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2, behavior: "smooth" });
  }

  // Descobre qual vídeo está no meio enquanto a cliente arrasta
  function aoRolar() {
    const el = trilho.current;
    if (!el) return;
    const meio = el.scrollLeft + el.clientWidth / 2;
    let melhor = 0;
    let menor = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const card = c as HTMLElement;
      const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - meio);
      if (d < menor) {
        menor = d;
        melhor = i;
      }
    });
    setAtivo(melhor);
  }

  if (itens.length === 0) return null;

  return (
    <section className="py-10">
      <h2 className="px-4 text-center text-2xl font-bold">Descubra cada detalhe em vídeo</h2>
      <ul
        ref={trilho}
        onScroll={aoRolar}
        className="mt-6 flex snap-x snap-mandatory items-center gap-4 overflow-x-auto py-6 [scrollbar-width:none] px-[calc(50%-7.5rem)]"
      >
        {itens.map(({ id, produto, video }, i) => {
          const noMeio = i === ativo;
          const conteudo = (
            <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-fundo shadow-md">
              <video
                src={video.src}
                poster={video.capa}
                muted
                playsInline
                preload={Math.abs(i - ativo) <= 1 ? "metadata" : "none"}
                onEnded={() => centralizar((i + 1) % itens.length)}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl bg-white/90 p-2 text-left text-texto shadow">
                {produto.fotos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={produto.fotos[0]} alt="" loading="lazy" className="size-11 shrink-0 rounded-md object-cover" />
                )}
                <div className="min-w-0">
                  <p className="line-clamp-2 text-xs leading-tight">{produto.nome}</p>
                  {produto.preco > 0 ? (
                    <p className="text-sm font-bold">
                      {formatarPreco(produto.preco)}
                      {produto.precoDe && <span className="ml-1 text-[11px] font-normal text-suave line-through">{formatarPreco(produto.precoDe)}</span>}
                    </p>
                  ) : (
                    <p className="text-xs text-suave">Preço em breve</p>
                  )}
                </div>
              </div>
            </div>
          );
          return (
            <li
              key={id}
              className={`w-60 shrink-0 snap-center transition-transform duration-300 ${noMeio ? "z-10 scale-110" : "scale-90 opacity-90"}`}
            >
              {noMeio ? (
                <Link href={`${base}/videos#${id}`} className="block">
                  {conteudo}
                </Link>
              ) : (
                <button type="button" onClick={() => centralizar(i)} className="block w-full" aria-label={`Ver vídeo de ${produto.nome}`}>
                  {conteudo}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
