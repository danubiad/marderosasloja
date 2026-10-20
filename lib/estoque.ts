import "server-only";
import { connection } from "next/server";
import { produtos } from "@/data/produtos";
import { aplicarDisponibilidade, type Disponibilidade, type DisponibilidadeProduto } from "@/lib/disponibilidade";
import { kv } from "@/lib/kv";

// Ativo/inativo/esgotado e preço de custo de cada produto, editados na aba Produtos do painel.
// O custo fica numa chave separada e nunca vai para as páginas das clientes.

const CHAVE_DISPONIBILIDADE = "produtos:disponibilidade";
const CHAVE_CUSTOS = "produtos:custos";

export async function buscarDisponibilidade(): Promise<Disponibilidade> {
  return (await kv.get<Disponibilidade>(CHAVE_DISPONIBILIDADE)) ?? {};
}

export async function alterarDisponibilidade(produtoId: string, fn: (p: DisponibilidadeProduto) => void) {
  const d = await buscarDisponibilidade();
  const p = d[produtoId] ?? {};
  fn(p);
  d[produtoId] = p;
  await kv.set(CHAVE_DISPONIBILIDADE, d);
}

/** Produtos que aparecem no catálogo agora (lido a cada acesso, para valer na hora que a dona muda). */
export async function produtosDisponiveis() {
  await connection();
  return aplicarDisponibilidade(produtos, await buscarDisponibilidade());
}

/** produtoId -> preço de custo */
export async function buscarCustos(): Promise<Record<string, number>> {
  return (await kv.get<Record<string, number>>(CHAVE_CUSTOS)) ?? {};
}

export async function salvarCusto(produtoId: string, custo: number | null) {
  const custos = await buscarCustos();
  if (custo === null) delete custos[produtoId];
  else custos[produtoId] = custo;
  await kv.set(CHAVE_CUSTOS, custos);
}
