import "server-only";
import { listarPedidos } from "@/lib/pedidos";

// Produtos mais pedidos nos últimos 7 dias (por número de peças, sem os pedidos cancelados).
// A vitrine mostra os 10 primeiros que estão ativos na frente de todos.
// Fica guardado 30 minutos para não ler o banco a cada visita.

const DURACAO = 30 * 60 * 1000;
let guardado: { ate: number; ids: string[] } | null = null;

export async function maisPedidosDaSemana(): Promise<string[]> {
  if (guardado && guardado.ate > Date.now()) return guardado.ids;
  try {
    const desde = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const pecas = new Map<string, number>();
    for (const p of await listarPedidos(300)) {
      if (p.status === "cancelado" || Date.parse(p.criadoEm) < desde) continue;
      for (const i of p.itens) pecas.set(i.produtoId, (pecas.get(i.produtoId) ?? 0) + i.pecas);
    }
    const ids = [...pecas].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([id]) => id);
    guardado = { ate: Date.now() + DURACAO, ids };
    return ids;
  } catch {
    return guardado?.ids ?? [];
  }
}
