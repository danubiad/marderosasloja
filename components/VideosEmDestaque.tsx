"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ItemFeed } from "@/components/FeedVideos";
import { useLoja } from "@/lib/loja";
import { formatarPreco } from "@/lib/format";

/** Fileira de vídeos embaixo da vitrine. Cada vídeo abre o feed de vídeos (o mesmo do botão de play). */
export function VideosEmDestaque({ itens }: { itens: ItemFeed[] }) {
  const { base } = useLoja();
  const trilho = useRef<HTMLUListElement>(null);

  // Toca (sem som) só os vídeos que estão aparecendo na tela
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }
      },
      { threshold: 0.6 },
    );
    trilho.current?.querySelectorAll("video").forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, []);

  if (itens.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl py-8">
      <h2 className="px-4 text-center font-serif text-3xl">Descubra cada detalhe em vídeo</h2>
      <ul ref={trilho} className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {itens.map(({ id, produto, video }) => (
          <li key={id} className="w-40 shrink-0 snap-start sm:w-48">
            <Link href={`${base}/videos#${id}`} className="block">
              <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-fundo">
                <video
                  src={video.src}
                  poster={video.capa}
                  muted
                  loop
                  playsInline
                  preload="none"
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white" aria-hidden>
                  <svg viewBox="0 0 24 24" className="ml-0.5 size-3.5" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </div>
              <p className="mt-2 truncate px-1 text-center text-sm uppercase">{produto.nome}</p>
              <p className="text-center text-sm font-bold">{produto.preco > 0 ? formatarPreco(produto.preco) : "Preço em breve"}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
