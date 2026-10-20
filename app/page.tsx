import { Banners } from "@/components/Banners";
import { BioLoja } from "@/components/BioLoja";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { Vitrine } from "@/components/Vitrine";
import { categorias } from "@/data/produtos";
import { produtosDisponiveis } from "@/lib/estoque";

export default async function Home() {
  const produtos = await produtosDisponiveis();
  return (
    <>
      <Cabecalho />
      <main className="flex-1">
        <Banners />
        <BioLoja totalProdutos={produtos.length} />
        <Vitrine produtos={produtos} categorias={categorias} />
      </main>
      <Rodape />
    </>
  );
}
