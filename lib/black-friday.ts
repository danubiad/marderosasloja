// Black Friday (pedido da dona, 27/11/2026): sexta 27, sábado 28 e domingo 29/11/2026.
// Enquanto vale, a faixa do topo fica preta com o texto da Black e todo produto ganha desconto pela categoria,
// calculado sobre o preço NORMAL (quem já estava em promoção volta ao preço cheio e recebe o desconto da Black).
// Termina sozinho no fim do domingo (horário de Brasília): aí os preços e promoções antigos voltam como estavam.
import type { Categoria, Produto } from "@/data/tipos";

const FIM = new Date("2026-11-30T00:00:00-03:00").getTime();

export const textoBlackFriday = "Toda a loja está de BLACK FRIDAY • Nesta sexta, sábado e domingo";

export function blackFridayAtiva(agora = Date.now()) {
  return agora < FIM;
}

/** Desconto da categoria; produto em mais de uma categoria fica com o maior. */
const DESCONTOS: [Categoria, number][] = [
  ["Calcinhas", 0.07],
  ["Baby Doll", 0.06],
  ["Conjuntos", 0.05],
];
const DESCONTO_DEMAIS = 0.04;

export function descontoBlackFriday(p: Pick<Produto, "categorias">) {
  return DESCONTOS.find(([c]) => p.categorias.includes(c))?.[1] ?? DESCONTO_DEMAIS;
}

const comDesconto = (valor: number, desconto: number) => Math.round(valor * (1 - desconto) * 100) / 100;

/** Preço da Black: o normal (precoDe, se estava em promoção) vira o riscado e o novo é o normal com o desconto. */
export function aplicarBlackFriday<P extends Produto>(produto: P): P {
  if (!blackFridayAtiva() || !(produto.preco > 0)) return produto;
  const desconto = descontoBlackFriday(produto);
  const normal = produto.precoDe && produto.precoDe > produto.preco ? produto.precoDe : produto.preco;
  return {
    ...produto,
    preco: comDesconto(normal, desconto),
    precoDe: normal,
    precosTamanho: produto.precosTamanho
      ? Object.fromEntries(Object.entries(produto.precosTamanho).map(([t, v]) => [t, comDesconto(v, desconto)]))
      : undefined,
  };
}
