import type { Metadata } from "next";
import { FeedVideos } from "@/components/FeedVideos";
import { montarFeed } from "@/data/produtos";
import { produtosDisponiveis } from "@/lib/estoque";
import { loja } from "@/lib/config";

export const metadata: Metadata = {
  title: `Vídeos — ${loja.nome}`,
  description: "Veja os produtos em vídeo e monte seu pedido.",
};

export default async function PaginaVideos() {
  return <FeedVideos itens={montarFeed(await produtosDisponiveis())} />;
}
