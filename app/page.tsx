import { BannerBlackFriday } from "@/components/BannerBlackFriday";
import { Banners } from "@/components/Banners";
import { blackFridayAtiva } from "@/lib/black-friday";
import { BioLoja } from "@/components/BioLoja";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { VideosEmDestaque } from "@/components/VideosEmDestaque";
import { Vitrine } from "@/components/Vitrine";
import { categorias, montarFeed } from "@/data/produtos";
import { produtosDisponiveis } from "@/lib/estoque";
import { maisPedidosDaSemana } from "@/lib/mais-pedidos";

export default async function Home() {
  const [produtos, maisPedidos] = await Promise.all([produtosDisponiveis(), maisPedidosDaSemana()]);
  return (
    <>
      <Cabecalho />
      <main className="flex-1">
        <BannerBlackFriday />
        <Banners soGrupo={blackFridayAtiva()} />
        <BioLoja totalProdutos={produtos.length} />
        <Vitrine produtos={produtos} categorias={categorias} maisPedidos={maisPedidos} />
        <VideosEmDestaque itens={montarFeed(produtos)} />
      </main>
      <Rodape />
    </>
  );
}
