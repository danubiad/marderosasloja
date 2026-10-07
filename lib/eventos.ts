import "server-only";
import { diaSP } from "@/lib/datas";
import { kv } from "@/lib/kv";

// Contadores diários do que as clientes fazem no catálogo da loja (aba Dados do painel).
// Cada dia é um hash `eventos:AAAA-MM-DD` com os totais e as origens das visitas.

export const tiposEvento = ["sessao", "produto", "carrinho", "whatsapp"] as const;
export type TipoEvento = (typeof tiposEvento)[number];

export type SomaEventos = Record<TipoEvento, number> & {
  origens: Record<string, number>;
  campanhas: Record<string, number>;
  sessoesPorDia: Record<string, number>;
};

export async function registrarEvento(tipo: TipoEvento, origem?: string, campanha?: string) {
  const chave = `eventos:${diaSP()}`;
  await kv.hincrby(chave, tipo);
  if (tipo !== "sessao") return;
  await kv.hincrby(chave, `origem:${origem || "direto"}`);
  if (campanha) await kv.hincrby(chave, `campanha:${campanha}`);
}

/** Soma os eventos de vários dias. */
export async function somarEventos(dias: string[]): Promise<SomaEventos> {
  const total: SomaEventos = { sessao: 0, produto: 0, carrinho: 0, whatsapp: 0, origens: {}, campanhas: {}, sessoesPorDia: {} };
  const hashes = await Promise.all(dias.map((d) => kv.hgetall(`eventos:${d}`)));
  hashes.forEach((h, i) => (total.sessoesPorDia[dias[i]] = Number(h.sessao) || 0));
  for (const h of hashes) {
    for (const [campo, valor] of Object.entries(h)) {
      const n = Number(valor) || 0;
      const [grupo, nome] = campo.split(/:(.*)/);
      if (grupo === "origem") total.origens[nome] = (total.origens[nome] ?? 0) + n;
      else if (grupo === "campanha") total.campanhas[nome] = (total.campanhas[nome] ?? 0) + n;
      else if ((tiposEvento as readonly string[]).includes(campo)) total[campo as TipoEvento] += n;
    }
  }
  return total;
}
