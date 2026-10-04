import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { ProdutoDetalhe } from "@/components/ProdutoDetalhe";
import { buscarProdutoPorSlug, produtos } from "@/data/produtos";
import { loja } from "@/lib/config";

export function generateStaticParams() {
  return produtos.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/produto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const produto = buscarProdutoPorSlug(slug);
  if (!produto) return {};
  return {
    title: `${produto.nome} — ${loja.nome}`,
    description: produto.descricao,
    openGraph: { images: produto.fotos[0] ? [produto.fotos[0]] : ["/logo/logo.jpg"] },
  };
}

export default async function PaginaProduto({ params }: PageProps<"/produto/[slug]">) {
  const { slug } = await params;
  const produto = buscarProdutoPorSlug(slug);
  if (!produto) notFound();

  return (
    <>
      <Cabecalho voltar />
      <main className="flex-1">
        <ProdutoDetalhe produto={produto} />
      </main>
    </>
  );
}
