"use server";

import { refresh } from "next/cache";
import { substituirItem } from "@/lib/conferencia";
import { buscarPedido, chaveConferencia, clientePodeSubstituir, removerSubstituicao } from "@/lib/pedidos";

// A cliente acessa pelo link do pedido (o id é aleatório e funciona como chave de acesso).

export async function substituirCliente(
  id: string,
  origem: string,
  produtoId: string,
  cor: string,
  tamanho: string,
  quantidade: number,
): Promise<string | void> {
  const pedido = await buscarPedido(id);
  if (!pedido) return "Pedido não encontrado.";
  try {
    await substituirItem(pedido, origem, produtoId, cor, tamanho, quantidade, "cliente");
  } catch (e) {
    return e instanceof Error ? e.message : "Não foi possível salvar a troca.";
  }
  refresh();
}

export async function removerSubstituicaoCliente(id: string, subId: string) {
  const pedido = await buscarPedido(id);
  const sub = pedido?.substituicoes?.find((s) => s.id === subId);
  // A cliente só desfaz as trocas dela que a loja ainda não conferiu
  if (!pedido || !sub || sub.por !== "cliente" || !clientePodeSubstituir(pedido)) return;
  if (pedido.conferencia?.[chaveConferencia.substituicao(subId)]) return;
  await removerSubstituicao(id, subId);
  refresh();
}
