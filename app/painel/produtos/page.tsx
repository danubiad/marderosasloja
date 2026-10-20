import type { Metadata } from "next";
import { produtos } from "@/data/produtos";
import { buscarCustos, buscarDisponibilidade } from "@/lib/estoque";
import { AbasPainel } from "../AbasPainel";
import { bloqueioPainel } from "../acesso";
import { ListaProdutos, type ProdutoPainel } from "./ListaProdutos";

export const metadata: Metadata = {
  title: "Produtos — Painel Mar de Rosas",
  robots: { index: false, follow: false },
};

export default async function Produtos() {
  const bloqueio = await bloqueioPainel();
  if (bloqueio) return bloqueio;

  const [disponibilidade, custos] = await Promise.all([buscarDisponibilidade(), buscarCustos()]);
  const lista: ProdutoPainel[] = [...produtos]
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      referencia: p.referencia,
      foto: p.fotos[0],
      preco: p.preco,
      precoDe: p.precoDe,
      precosTamanho: p.precosTamanho,
      cores: p.cores.map(({ nome, hex, amostra }) => ({ nome, hex, amostra })),
      tamanhos: p.tamanhos,
      disponibilidade: disponibilidade[p.id] ?? {},
      custo: custos[p.id],
    }));

  return (
    <>
      <AbasPainel atual="/painel/produtos" />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-5">
        <p className="rounded-md bg-creme px-4 py-3 text-sm">
          Inativar tira o produto do catálogo da loja, das revendedoras e da sacolinha do Instagram na hora. Em{" "}
          <strong>Variações</strong>, desligue uma cor ou um tamanho inteiro, ou toque no tamanho de uma cor para marcar como esgotado.
          O preço de custo só aparece aqui no painel e serve para calcular o lucro de cada pedido.
        </p>
        <ListaProdutos produtos={lista} />
      </main>
    </>
  );
}
