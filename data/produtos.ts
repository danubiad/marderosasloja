// Cadastro dos produtos: a lista fica em data/catalogo.ts e os vídeos em data/videos.ts.
// Fotos em /public/produtos/<produto>/, recortes das bolinhas em /public/produtos/amostras/
// e vídeos em /public/videos/<produto>/ (novos recortes: `npm run amostra`).
import { catalogo } from "./catalogo";
import type { Produto } from "./tipos";
import { videosPorProduto } from "./videos";
import { precoComMargem } from "@/lib/margem";

export * from "./tipos";

export const produtos = catalogo.map((p) => ({ ...p, videos: p.videos ?? videosPorProduto[p.slug] ?? [] }));

/** Produtos com o preço de venda da revendedora (atacado + margem). */
export function produtosComMargem(margem: number) {
  return produtos.map((p) => ({
    ...p,
    preco: precoComMargem(p.preco, margem),
    precoDe: p.precoDe ? precoComMargem(p.precoDe, margem) : undefined,
  }));
}

/** Itens do feed de vídeos: um por vídeo, dos produtos mais novos para os mais antigos. */
export function montarFeed(lista: Produto[]) {
  return [...lista]
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .flatMap((produto) => (produto.videos ?? []).map((video, i) => ({ id: `${produto.slug}-${i + 1}`, produto, video })));
}

export function buscarProduto(id: string) {
  return produtos.find((p) => p.id === id);
}

export function buscarProdutoPorSlug(slug: string) {
  return produtos.find((p) => p.slug === slug);
}
