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

/**
 * Muda a quantidade de uma linha do pedido (chave do item) ou de uma substituição/acréscimo (sub:<id>).
 * 0 remove: o item fica marcado como removido; a substituição/acréscimo é apagada.
 */
export function mudarQuantidade(id: string, chave: string, quantidade: number) {
  return atualizar(id, (p) => {
    if (chave.startsWith("sub:")) {
      const subId = chave.slice(4);
      if (quantidade === 0) {
        p.substituicoes = (p.substituicoes ?? []).filter((s) => s.id !== subId);
        if (p.conferencia) delete p.conferencia[chave];
      } else {
        const sub = p.substituicoes?.find((s) => s.id === subId);
        if (sub) sub.quantidade = quantidade;
      }
      return;
    }
    const [produtoId, cor, tamanho] = chave.split("|");
    const original = p.itens.find((i) => i.produtoId === produtoId)?.grade[`${cor}|${tamanho}`];
    if (original === undefined) return;
    p.quantidades ??= {};
    if (quantidade === original) delete p.quantidades[chave];
    else p.quantidades[chave] = quantidade;
    if (Object.keys(p.quantidades).length === 0) delete p.quantidades;
    // Item removido sai da conferência (as trocas já escolhidas para ele continuam no pedido)
    if (quantidade === 0 && p.conferencia) delete p.conferencia[chave];
  });
}

export function marcarCompraEnviadaMeta(id: string) {
  return atualizar(id, (p) => void (p.compraEnviadaMeta = new Date().toISOString()));
}
