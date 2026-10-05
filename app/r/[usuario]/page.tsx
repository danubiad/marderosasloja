import { notFound } from "next/navigation";
import { Banners } from "@/components/Banners";
import { BioRevendedora } from "@/components/BioRevendedora";
import { Cabecalho } from "@/components/Cabecalho";
import { Vitrine } from "@/components/Vitrine";
import { categorias, produtosComMargem } from "@/data/produtos";
import { buscarRevendedoraAtiva } from "@/lib/revendedoras";

export default async function CatalogoRevendedora({ params }: PageProps<"/r/[usuario]">) {
  const { usuario } = await params;
  const r = await buscarRevendedoraAtiva(usuario);
  if (!r) notFound();
  const lista = produtosComMargem(r.margem);

  return (
    <>
      <Cabecalho />
      <main className="flex-1 pb-10">
        <Banners />
        <BioRevendedora nome={r.nome} whatsapp={r.whatsapp} totalProdutos={lista.length} />
        <Vitrine produtos={lista} categorias={categorias} />
      </main>
    </>
  );
}
