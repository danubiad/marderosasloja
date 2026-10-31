import type { Metadata } from "next";
import Link from "next/link";
import { loja } from "@/lib/config";
import { authenticatorLigado, buscarConta, linkSenhaPainelValido } from "@/lib/painel";
import { FormSenhaNovaPainel } from "./FormSenhaNovaPainel";

export const metadata: Metadata = {
  title: `Senha nova — Painel ${loja.vendedora}`,
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// Link do e-mail de "Esqueci minha senha" do painel (?t=<código>)
export default async function NovaSenhaPainel({ searchParams }: PageProps<"/painel/nova-senha">) {
  const { t } = await searchParams;
  const codigo = typeof t === "string" ? t : "";
  const valido = await linkSenhaPainelValido(codigo);

  return (
    <main className="mx-auto mt-16 grid w-full max-w-sm gap-4 px-4">
      <h1 className="text-center font-serif text-3xl font-semibold">Senha nova do painel</h1>
      {valido ? (
        <FormSenhaNovaPainel link={codigo} pedeCodigo={authenticatorLigado(await buscarConta())} />
      ) : (
        <>
          <p className="rounded-md bg-creme px-4 py-3 text-center">Este link venceu ou já foi usado. Ele vale por 30 minutos e funciona uma vez só.</p>
          <Link href="/painel" className="text-center text-suave underline">
            Voltar ao painel
          </Link>
        </>
      )}
    </main>
  );
}
