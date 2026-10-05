import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarrinhoProvider } from "@/lib/carrinho";
import { LojaProvider } from "@/lib/loja";
import { buscarRevendedoraAtiva, publica } from "@/lib/revendedoras";

export async function generateMetadata({ params }: LayoutProps<"/r/[usuario]">): Promise<Metadata> {
  const { usuario } = await params;
  const r = await buscarRevendedoraAtiva(usuario);
  if (!r) return {};
  return {
    title: `Catálogo de ${r.nome} — Mar de Rosas Lingerie`,
    description: `Moda íntima Mar de Rosas. Monte seu pedido com ${r.nome}.`,
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
