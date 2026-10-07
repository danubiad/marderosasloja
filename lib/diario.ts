import "server-only";
import { kv } from "@/lib/kv";

// Números do dia anotados pela dona no painel (aba Dados):
// gasto com tráfego pago, seguidores no Instagram e mensagens recebidas no WhatsApp.

export type RegistroDia = { gasto?: number; seguidores?: number; mensagens?: number };

export const camposRegistro = ["gasto", "seguidores", "mensagens"] as const;

export async function lerRegistros(dias: string[]): Promise<Record<string, RegistroDia>> {
  const valores = await kv.mget<RegistroDia>(dias.map((d) => `diario:${d}`));
  return Object.fromEntries(dias.map((d, i) => [d, valores[i] ?? {}]));
}

/** Atualiza os campos informados; os que vierem vazios continuam como estavam. */
export async function salvarRegistro(dia: string, novos: RegistroDia) {
  const atual = (await kv.get<RegistroDia>(`diario:${dia}`)) ?? {};
  await kv.set(`diario:${dia}`, { ...atual, ...novos });
}
