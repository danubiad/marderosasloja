import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { loja } from "@/lib/config";
import { usuarioDoLinkSenha } from "@/lib/revendedoras";
import { FormNovaSenha } from "./FormNovaSenha";

export const metadata: Metadata = {
  title: `Nova senha — ${loja.vendedora}`,
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// Link que a loja manda pelo WhatsApp em "Esqueci minha senha" (?t=<código>)
export default async function NovaSenha({ searchParams }: PageProps<"/revendedora/nova-senha">) {
  const { t } = await searchParams;
  const codigo = typeof t === "string" ? t : "";
  const valido = Boolean(await usuarioDoLinkSenha(codigo));

  return (
    <>
      <header className="border-b border-linha bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
          <Link href="/">
            <Image src="/logo/logo.jpg" alt={loja.vendedora} width={96} height={64} className="h-12 w-auto" priority />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
        <h1 className="text-center font-serif text-3xl font-semibold">Criar senha nova</h1>
        {valido ? (
          <FormNovaSenha codigo={codigo} />
        ) : (
          <div className="mt-6 grid gap-3 text-center">
            <p className="rounded-md bg-creme px-4 py-3">
              Este link venceu ou já foi usado. Ele vale por 1 hora e funciona uma vez só.
            </p>
            <Link href="/revendedora" className="text-suave underline">
              Pedir outro em &quot;Esqueci minha senha&quot;
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
