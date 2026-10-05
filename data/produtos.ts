// Cadastro dos produtos: a lista fica em data/catalogo.ts e os vídeos em data/videos.ts.
// Fotos em /public/produtos/<produto>/, recortes das bolinhas em /public/produtos/amostras/
// e vídeos em /public/videos/<produto>/ (novos recortes: `npm run amostra`).
import { catalogo } from "./catalogo";
import { videosPorProduto } from "./videos";

export * from "./tipos";

export const produtos = catalogo.map((p) => ({ ...p, videos: p.videos ?? videosPorProduto[p.slug] ?? [] }));

export function buscarProduto(id: string) {
  return produtos.find((p) => p.id === id);
}

export function buscarProdutoPorSlug(slug: string) {
  return produtos.find((p) => p.slug === slug);
}
