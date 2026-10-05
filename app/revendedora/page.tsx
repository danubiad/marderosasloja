import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revendedoraLogada } from "@/lib/revendedoras";
import { FormsAcesso } from "./FormsAcesso";

export const metadata: Metadata = {
  title: "Seja revendedora — Mar de Rosas Lingerie",
  description: "Crie seu catálogo Mar de Rosas com o seu preço e receba pedidos das suas clientes.",
};

export default async function PaginaRevendedora() {
  if (await revendedoraLogada()) redirect("/revendedora/painel");
  return (
    <>
      <header className="border-b border-linha bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
          <Link href="/">
            <Image src="/logo/logo.jpg" alt="Mar de Rosas Lingerie" width={96} height={64} className="h-12 w-auto" priority />
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <FormsAcesso />
      </main>
    </>
  );
}
