import Link from "next/link";
import { Cabecalho } from "@/components/Cabecalho";

export default function NaoEncontrado() {
  return (
    <>
      <Cabecalho />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-suave">O produto ou pedido que você procura não existe.</p>
        <Link href="/" className="mt-6 rounded-md bg-texto px-6 py-3 font-semibold text-white">
          Ver catálogo
        </Link>
      </main>
    </>
  );
}
