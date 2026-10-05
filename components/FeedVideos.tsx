"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GradeQuantidade } from "@/components/GradeQuantidade";
import { IconeCarrinho, IconeMais, IconeSacola, IconeSom, IconeVoltar } from "@/components/icones";
import type { Produto, Video } from "@/data/produtos";
import { totalPecas } from "@/lib/calculo";
import { useCarrinho } from "@/lib/carrinho";
import { useLoja } from "@/lib/loja";
import { formatarPreco } from "@/lib/format";

export type ItemFeed = { id: string; produto: Produto; video: Video };

export function FeedVideos({ itens }: { itens: ItemFeed[] }) {
  const router = useRouter();
  const { base } = useLoja();
  const { itens: carrinho } = useCarrinho();
  const pecasCarrinho = Object.values(carrinho).reduce((acc, g) => acc + totalPecas(g), 0);
  const [mudo, setMudo] = useState(true);
  const [ativo, setAtivo] = useState(itens[0]?.id);
  const [aberto, setAberto] = useState<Produto | null>(null);
  const container = useRef<HTMLDivElement>(null);

  // Começa no vídeo indicado no endereço (#slug-1), vindo da página do produto
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  // Toca só o vídeo visível
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setAtivo(e.target.id);
      },
      { root: container.current, threshold: 0.6 },
    );
    container.current?.querySelectorAll("[data-item]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    container.current?.querySelectorAll("video").forEach((v) => {
      if (v.dataset.id === ativo && !aberto) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [ativo, aberto]);

  return (
    <div className="fixed inset-0 bg-black">
      <div ref={container} className="h-full snap-y snap-mandatory overflow-y-auto [scrollbar-width:none]">
        {itens.map(({ id, produto, video }) => (
          <section key={id} id={id} data-item className="relative h-dvh w-full snap-start snap-always">
            <video
              data-id={id}
              src={video.src}
              poster={video.capa}
              muted={mudo}
              loop
              playsInline
              preload={id === ativo ? "auto" : "metadata"}
              onClick={(e) => (e.currentTarget.paused ? e.currentTarget.play() : e.currentTarget.pause())}
              className="h-full w-full object-cover"
            />

            <div
              className="absolute inset-x-3 bottom-0 flex items-end gap-3"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
            >
              <div className="min-w-0 flex-1 rounded-lg bg-white/95 px-4 py-3 shadow-lg">
                <p className="truncate text-lg uppercase">{produto.nome}</p>
                <p className="text-sm">{produto.preco > 0 ? formatarPreco(produto.preco) : "Preço em breve"}</p>
                <Link href={`${base}/produto/${produto.slug}`} className="mt-1 inline-flex items-center gap-1 text-sm text-sky-700">
                  <IconeSacola /> Ver produto
                </Link>
              </div>
              <div className="flex flex-col items-center gap-4 pb-1">
                <button
                  type="button"
                  onClick={() => setMudo((m) => !m)}
                  className="rounded-full bg-black/50 p-2.5 text-white"
                  aria-label={mudo ? "Ligar som" : "Desligar som"}
                >
                  <IconeSom ligado={!mudo} />
                </button>
                <button
                  type="button"
                  onClick={() => setAberto(produto)}
                  className="flex size-14 items-center justify-center rounded-full bg-sucesso text-white shadow-lg"
                  aria-label={`Adicionar ${produto.nome} ao carrinho`}
                >
                  <IconeMais />
                </button>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-between bg-gradient-to-b from-black/40 to-transparent px-3 pb-8"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push(base || "/"))}
          className="pointer-events-auto rounded-full p-2 text-white"
          aria-label="Voltar"
        >
          <IconeVoltar className="size-7" />
        </button>
        <Link
          href={`${base}/carrinho`}
          className="pointer-events-auto relative rounded-xl bg-white/80 p-2 text-sucesso"
          aria-label={`Carrinho com ${pecasCarrinho} peças`}
        >
          <IconeCarrinho />
          {pecasCarrinho > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-dourado-escuro px-1 text-xs font-bold text-white">
              {pecasCarrinho}
            </span>
          )}
        </Link>
      </div>

      {aberto && <PainelAdicionar produto={aberto} onFechar={() => setAberto(null)} />}
    </div>
  );
}

function PainelAdicionar({ produto, onFechar }: { produto: Produto; onFechar: () => void }) {
  const { itens, definirGrade } = useCarrinho();
  const { base } = useLoja();
  const grade = itens[produto.id] ?? {};
  const pecas = totalPecas(grade);
  const temPreco = produto.preco > 0;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onFechar} aria-label="Fechar" />
      <div
        className="relative max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white px-4 pt-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-linha" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold uppercase">{produto.nome}</h2>
            <p className="text-sm text-suave">{produto.referencia}</p>
          </div>
          <p className="text-xl font-bold">{temPreco ? formatarPreco(produto.preco) : ""}</p>
        </div>

        {temPreco ? (
          <p className="mt-3 text-center text-sm text-orange-600">Aperte no + para incluir a quantidade de peças.</p>
        ) : (
          <p className="mt-3 rounded border border-linha bg-creme px-3 py-2 text-center text-sm">
            Este produto estará disponível para pedido em breve.
          </p>
        )}

        <div className="mt-3">
          <GradeQuantidade
            cores={produto.cores}
            tamanhos={produto.tamanhos}
            legendas={produto.legendaTamanhos}
            grade={grade}
            onChange={temPreco ? (g) => definirGrade(produto.id, g) : undefined}
          />
        </div>

        {temPreco && (
          <div className="mt-4 flex justify-between">
            <span>{pecas} pç.</span>
            <span className="font-semibold">{formatarPreco(pecas * produto.preco)}</span>
          </div>
        )}

        <div className="mt-4 grid gap-2">
          {pecas > 0 && (
            <Link href={`${base}/carrinho`} className="rounded-md bg-dourado-escuro px-4 py-3 text-center text-lg font-bold text-white">
              Ver carrinho
            </Link>
          )}
          <button
            type="button"
            onClick={onFechar}
            className="rounded-md border-2 border-texto px-4 py-3 text-lg font-bold"
          >
            Continuar assistindo
          </button>
          <Link href={`${base}/produto/${produto.slug}`} className="py-2 text-center text-sm text-sky-700 underline">
            Ver página do produto
          </Link>
        </div>
      </div>
    </div>
  );
}
