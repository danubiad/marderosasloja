import { textoPedidoMinimo } from "@/lib/config";

/** Faixa no topo com o texto passando, como letreiro. */
export function FaixaAviso() {
  const texto = `Loja de atacado • ${textoPedidoMinimo}`;
  const repeticoes = Array.from({ length: 4 }, (_, i) => (
    <span key={i} className="shrink-0 px-8" aria-hidden={i > 0}>
      {texto}
    </span>
  ));

  return (
    <div className="overflow-hidden bg-dourado-escuro text-sm font-semibold uppercase tracking-wide text-white">
      <div className="flex w-max animate-[letreiro_28s_linear_infinite] py-2 motion-reduce:animate-none">
        {repeticoes}
        {repeticoes}
      </div>
    </div>
  );
}
