import "server-only";
import { kv } from "@/lib/kv";

// Meta de vendas da loja, editável na aba Dados do painel.
// A semanal é a diária × 7 e a mensal é a diária × dias do mês.

const CHAVE = "config:meta-diaria";
export const META_DIARIA_INICIAL = 5000;

export async function buscarMetaDiaria() {
  return (await kv.get<number>(CHAVE)) ?? META_DIARIA_INICIAL;
}

export async function salvarMetaDiaria(valor: number) {
  await kv.set(CHAVE, valor);
}
