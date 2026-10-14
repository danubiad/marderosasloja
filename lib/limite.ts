import "server-only";
import { headers } from "next/headers";
import { kv } from "@/lib/kv";

// Limite de tentativas por aparelho (IP) numa janela de tempo, contra robôs:
// senhas testadas em sequência e pedidos/carrinhos falsos em massa.
// Os limites são folgados porque várias clientes podem sair pelo mesmo IP da operadora.

export const limites = {
  loginPainel: { maximo: 10, segundos: 15 * 60 },
  loginRevendedora: { maximo: 10, segundos: 15 * 60 },
  cadastroRevendedora: { maximo: 5, segundos: 60 * 60 },
  pedido: { maximo: 15, segundos: 10 * 60 },
  carrinho: { maximo: 120, segundos: 60 },
  evento: { maximo: 300, segundos: 60 },
} as const;

async function ip() {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

/** Conta mais uma tentativa e diz se ainda está dentro do limite. Se o banco falhar, deixa passar. */
export async function dentroDoLimite(nome: keyof typeof limites) {
  const { maximo, segundos } = limites[nome];
  const janela = Math.floor(Date.now() / 1000 / segundos);
  try {
    return (await kv.incrExpira(`limite:${nome}:${await ip()}:${janela}`, segundos)) <= maximo;
  } catch (err) {
    console.error(err);
    return true;
  }
}
