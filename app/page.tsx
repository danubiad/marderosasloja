import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { Vitrine } from "@/components/Vitrine";
import { categorias, produtos } from "@/data/produtos";

export default function Home() {
  return (
    <>
      <Cabecalho />
      <main className="flex-1">
        <section className="border-b border-linha bg-creme px-4 py-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-dourado-escuro">Catálogo Atacado</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-texto">Mar de Rosas Lingerie</h1>
        </section>
        <Vitrine produtos={produtos} categorias={categorias} />
      </main>
      <Rodape />
    </>
  );
}
