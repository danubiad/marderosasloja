import type { Metadata } from "next";
import { FeedVideos } from "@/components/FeedVideos";
import { montarFeed, produtos } from "@/data/produtos";
import { loja } from "@/lib/config";

export const metadata: Metadata = {
  title: `Vídeos — ${loja.nome}`,
  description: "Veja os produtos em vídeo e monte seu pedido.",
};

export default function PaginaVideos() {
  return <FeedVideos itens={montarFeed(produtos)} />;
}
