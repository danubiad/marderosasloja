// Preço de venda da revendedora: preço de atacado + margem (%), arredondado para centavos.
export function precoComMargem(preco: number, margem = 0) {
  if (!margem) return preco;
  return Math.round(preco * (1 + margem / 100) * 100) / 100;
}

export const MARGEM_MAXIMA = 300;
