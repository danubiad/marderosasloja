import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { ProdutoDetalhe } from "@/components/ProdutoDetalhe";
import { produtosComMargem } from "@/data/produtos";
import { produtosDisponiveis } from "@/lib/estoque";
import { buscarRevendedoraAtiva } from "@/lib/revendedoras";

export default async function ProdutoRevendedora({ params }: PageProps<"/r/[usuario]/produto/[slug]">) {
  const { usuario, slug } = await params;
  const r = await buscarRevendedoraAtiva(usuario);
  const produto = r && produtosComMargem(r.margem, await produtosDisponiveis()).find((p) => p.slug === slug);
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
