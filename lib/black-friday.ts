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

/** Cor preta do produto: "Preto" primeiro; senão a que começa com Preto/Preta ("Preto com Renda Rosa", "Preto Cisnes");
 *  senão a que termina em preto sem ser mistura ("Vaquinha Preta", sim; "Vermelho com Preto", não). */
function corPreta(p: Produto) {
  const nome = (c: Produto["cores"][number]) => c.nome.trim().toLowerCase();
  return (
    p.cores.find((c) => nome(c) === "preto" || nome(c) === "preta") ??
    p.cores.find((c) => /^pret[oa]\b/.test(nome(c))) ??
    p.cores.find((c) => /\bpret[oa]s?$/.test(nome(c)) && !/ (com|e) /.test(nome(c)))
  );
}

/** Na Black (pedido da dona, 27/11/2026): em produto que tem preto, a foto preta vira a capa e a bolinha preta vai para 1º. */
function capaPreta<P extends Produto>(produto: P): P {
  const preta = corPreta(produto);
  if (!preta) return produto;
  const fotos = preta.foto && produto.fotos.includes(preta.foto) ? [preta.foto, ...produto.fotos.filter((f) => f !== preta.foto)] : produto.fotos;
  return { ...produto, fotos, cores: [preta, ...produto.cores.filter((c) => c !== preta)] };
}

/** Preço da Black: o normal (precoDe, se estava em promoção) vira o riscado e o novo é o normal com o desconto. */
export function aplicarBlackFriday<P extends Produto>(original: P): P {
  if (!blackFridayAtiva()) return original;
  const produto = capaPreta(original);
  if (!(produto.preco > 0)) return produto;
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
