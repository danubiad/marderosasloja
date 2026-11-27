"use client";

import { blackFridayAtiva, textoBlackFriday } from "@/lib/black-friday";
import { textoPedidoMinimo } from "@/lib/config";
import { useLoja } from "@/lib/loja";

/** Faixa no topo com o texto passando, como letreiro. Na Black Friday (lib/black-friday.ts) fica preta, com o texto da Black. */
export function FaixaAviso() {
  const { revendedora } = useLoja();
  const black = !revendedora && blackFridayAtiva();
  const texto = revendedora
    ? `Catálogo de ${revendedora.nome} • Monte seu pedido e envie pelo WhatsApp`
    : black
      ? textoBlackFriday
      : `Loja de atacado • ${textoPedidoMinimo}`;
  const repeticoes = Array.from({ length: 4 }, (_, i) => (
    <span key={i} className="shrink-0 px-8" aria-hidden={i > 0}>
      {texto}
    </span>
  ));

  return (
    <div className={`overflow-hidden ${black ? "bg-black" : "bg-dourado-escuro"} text-sm font-semibold uppercase tracking-wide text-white`}>
      <div className="flex w-max animate-[letreiro_28s_linear_infinite] py-2 motion-reduce:animate-none">
        {repeticoes}
        {repeticoes}
      </div>
    </div>
  );
}
