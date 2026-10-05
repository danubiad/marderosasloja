import type { Metadata } from "next";
import Link from "next/link";
import { FeedVideos, type ItemFeed } from "@/components/FeedVideos";
import { produtos } from "@/data/produtos";
import { loja } from "@/lib/config";

export const metadata: Metadata = {
  title: `Vídeos — ${loja.nome}`,
  description: "Veja os produtos em vídeo e monte seu pedido.",
};

export default function PaginaVideos() {
  const itens: ItemFeed[] = [...produtos]
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .flatMap((produto) =>
      (produto.videos ?? []).map((video, i) => ({ id: `${produto.slug}-${i + 1}`, produto, video })),
    );

  if (itens.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-suave">Ainda não há vídeos.</p>
        <Link href="/" className="mt-6 rounded-md bg-texto px-6 py-3 font-semibold text-white">
          Ver catálogo
        </Link>
      </main>
    );
  }

  return <FeedVideos itens={itens} />;
}
