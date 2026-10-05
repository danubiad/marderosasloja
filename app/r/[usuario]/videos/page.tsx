import { notFound } from "next/navigation";
import { FeedVideos } from "@/components/FeedVideos";
import { montarFeed, produtosComMargem } from "@/data/produtos";
import { buscarRevendedoraAtiva } from "@/lib/revendedoras";

export default async function VideosRevendedora({ params }: PageProps<"/r/[usuario]/videos">) {
  const { usuario } = await params;
  const r = await buscarRevendedoraAtiva(usuario);
  if (!r) notFound();
  return <FeedVideos itens={montarFeed(produtosComMargem(r.margem))} />;
}
