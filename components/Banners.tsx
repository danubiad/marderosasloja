"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconeWhatsapp } from "@/components/icones";
import { useLoja } from "@/lib/loja";
import { banners, grupoClientes } from "@/lib/config";

/**
 * Banners do topo em vídeo (sem som). No celular é um carrossel: quando o vídeo acaba, passa para o próximo.
 * No computador os vídeos aparecem lado a lado. Só toca o vídeo que está na tela.
 * Embaixo, o convite para o grupo de clientes no WhatsApp (só no catálogo da loja, não no das revendedoras).
 */
export function Banners() {
  const { base, revendedora } = useLoja();
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);

  // Toca o vídeo que aparece na tela e pausa os outros
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }),
      { threshold: 0.6 },
    );
    el.querySelectorAll("video").forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, []);

  function acabou(v: HTMLVideoElement, i: number) {
    const el = trilho.current;
    const carrossel = el && el.scrollWidth > el.clientWidth + 1;
    if (el && carrossel) {
      const proximo = (i + 1) % banners.length;
      el.scrollTo({ left: proximo * el.clientWidth, behavior: "smooth" });
      // Se o próximo já estava na tela, o observador não avisa: toca de novo daqui
      v.currentTime = 0;
    } else {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  }

  return (
    <>
      <section className="relative">
        <div
          ref={trilho}
          onScroll={(e) => setAtual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:mx-auto md:max-w-5xl md:gap-3 md:overflow-visible md:px-4 md:pt-4"
        >
          {banners.map((b, i) => (
            <Link
              key={b.video}
              href={`${base}/produto/${b.produto}`}
              aria-label={b.alt}
              className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden md:w-auto md:flex-1 md:rounded-lg"
            >
              <video
                src={b.video}
                poster={b.capa}
                muted
                playsInline
                autoPlay={i === 0}
                preload={i === 0 ? "auto" : "metadata"}
                onEnded={(e) => acabou(e.currentTarget, i)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </Link>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 md:hidden">
          {banners.map((b, i) => (
            <span
              key={b.video}
              className={`size-2.5 rounded-full border border-white ${i === atual ? "bg-dourado-escuro" : "bg-white/70"}`}
            />
          ))}
        </div>
      </section>
      {!revendedora && (
        <div className="px-4 pt-4 text-center">
          <a
            href={grupoClientes}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow"
          >
            <IconeWhatsapp className="size-5" />
            Entre no grupo de clientes
          </a>
        </div>
      )}
    </>
  );
}
