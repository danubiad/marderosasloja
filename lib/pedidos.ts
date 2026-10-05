import "server-only";
import { kv } from "@/lib/kv";
import {
  chaveConferencia,
  type Conferencia,
  type Pedido,
  type StatusPedido,
  type Substituicao,
} from "@/lib/tipos-pedido";

export * from "@/lib/tipos-pedido";

const NUMERO_INICIAL = 1000;

export async function proximoNumero(): Promise<number> {
  return NUMERO_INICIAL + (await kv.incr("pedidos:numero"));
}

export async function salvarPedido(pedido: Pedido) {
  await kv.set(`pedido:${pedido.id}`, pedido);
  await kv.lpush("pedidos", pedido.id);
  if (pedido.revendedora) await kv.lpush(`revendedora:${pedido.revendedora.usuario}:pedidos`, pedido.id);
}

export async function buscarPedido(id: string): Promise<Pedido | null> {
  return kv.get<Pedido>(`pedido:${id}`);
}

async function listarIds(chave: string, limite: number) {
  const ids = await kv.lrange(chave, 0, limite - 1);
  const pedidos = await kv.mget<Pedido>(ids.map((id) => `pedido:${id}`));
  return pedidos.filter((p): p is Pedido => p !== null);
}

/** Pedidos do mais recente para o mais antigo. */
export function listarPedidos(limite = 500) {
  return listarIds("pedidos", limite);
}

export function listarPedidosDaRevendedora(usuario: string, limite = 300) {
  return listarIds(`revendedora:${usuario}:pedidos`, limite);
}

async function atualizar(id: string, fn: (p: Pedido) => void) {
  const pedido = await buscarPedido(id);
  if (!pedido) return null;
  fn(pedido);
  await kv.set(`pedido:${id}`, pedido);
  return pedido;
}

export function atualizarStatus(id: string, status: StatusPedido) {
  return atualizar(id, (p) => void (p.status = status));
}

/** Marca um item (ou uma substituição) como separado (ok), em falta, ou limpa a marca. */
export function marcarItem(id: string, chave: string, estado: Conferencia | null) {
  return atualizar(id, (p) => {
    p.conferencia ??= {};
    if (estado) p.conferencia[chave] = estado;
    else delete p.conferencia[chave];
  });
}

export function adicionarSubstituicao(id: string, sub: Substituicao) {
  return atualizar(id, (p) => {
    p.substituicoes ??= [];
    p.substituicoes.push(sub);
  });
}

export function removerSubstituicao(id: string, subId: string) {
  return atualizar(id, (p) => {
    p.substituicoes = (p.substituicoes ?? []).filter((s) => s.id !== subId);
    if (p.conferencia) delete p.conferencia[chaveConferencia.substituicao(subId)];
  });
}
