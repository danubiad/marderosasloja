// Cadastro dos produtos: a lista fica em data/catalogo.ts.
// Fotos em /public/produtos/<produto>/ e recortes das bolinhas em /public/produtos/amostras/
// (novos recortes: `npm run amostra`, veja scripts/recortar-amostra.mjs).
import { catalogo } from "./catalogo";

export * from "./tipos";

export const produtos = catalogo;

export function buscarProduto(id: string) {
  return produtos.find((p) => p.id === id);
}

export function buscarProdutoPorSlug(slug: string) {
  return produtos.find((p) => p.slug === slug);
}
