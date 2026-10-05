"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { banners } from "@/lib/config";

/** Carrossel de banners no celular; no computador os três aparecem lado a lado. */
export function Banners() {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);

  // Passa sozinho a cada 5 segundos (só no celular, onde é carrossel)
  useEffect(() => {
    const id = setInterval(() => {
      const el = trilho.current;
      if (!el || el.scrollWidth <= el.clientWidth + 1) return;
      const proximo = (Math.round(el.scrollLeft / el.clientWidth) + 1) % banners.length;
      el.scrollTo({ left: proximo * el.clientWidth, behavior: "smooth" });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative">
      <div
        ref={trilho}
        onScroll={(e) => setAtual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:mx-auto md:max-w-5xl md:gap-3 md:overflow-visible md:px-4 md:pt-4"
      >
        {banners.map((b, i) => (
          <Link
            key={b.foto}
            href={`/produto/${b.produto}`}
            className="relative aspect-[4/5] w-full shrink-0 snap-center md:w-auto md:flex-1 md:overflow-hidden md:rounded-lg"
          >
            <Image src={b.foto} alt={b.alt} fill priority={i === 0} sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
          </Link>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 md:hidden">
        {banners.map((b, i) => (
          <span
            key={b.foto}
            className={`size-2.5 rounded-full border border-white ${i === atual ? "bg-dourado-escuro" : "bg-white/70"}`}
          />
        ))}
      </div>
    </section>
  );
}
