import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarrinhoProvider } from "@/lib/carrinho";
import { LojaProvider } from "@/lib/loja";
import { banners } from "@/lib/config";
import { buscarRevendedoraAtiva, enderecoFoto, publica } from "@/lib/revendedoras";

export async function generateMetadata({ params }: LayoutProps<"/r/[usuario]">): Promise<Metadata> {
  const { usuario } = await params;
  const r = await buscarRevendedoraAtiva(usuario);
  if (!r) return {};
  // Sem a marca da loja: nem no título, nem na prévia do link no WhatsApp/Instagram
  const titulo = `Catálogo de ${r.nome}`;
  const descricao = `Moda íntima e lingerie. Monte seu pedido com ${r.nome}.`;
  const foto = enderecoFoto(r);
  return {
    title: titulo,
    description: descricao,
    openGraph: {
      title: titulo,
      description: descricao,
      images: [foto ?? `/api/foto/produtos/${banners[0].produto}/1.jpg`],
      locale: "pt_BR",
      type: "website",
    },
    ...(foto && { icons: { icon: foto, apple: foto } }),
  };
}

// Catálogo da revendedora: mesmas telas da loja, com o preço dela e o carrinho separado.
export default async function LayoutRevendedora({ params, children }: LayoutProps<"/r/[usuario]">) {
  const { usuario } = await params;
  const r = await buscarRevendedoraAtiva(usuario);
  if (!r) notFound();

  return (
    <LojaProvider revendedora={publica(r)}>
      <CarrinhoProvider revendedora={r.usuario}>{children}</CarrinhoProvider>
    </LojaProvider>
  );
}
