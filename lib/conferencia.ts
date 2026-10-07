import "server-only";
import { randomBytes } from "crypto";
import { buscarProduto, precoDoTamanho } from "@/data/produtos";
import { precoComMargem } from "@/lib/margem";
import { adicionarSubstituicao, clientePodeSubstituir, quantidadeSemSubstituir, type Pedido } from "@/lib/pedidos";

/** Valida e grava uma substituição para um item marcado como em falta. */
export async function substituirItem(
  pedido: Pedido,
  origem: string,
  produtoId: string,
  cor: string,
  tamanho: string,
  quantidade: number,
  por: "loja" | "revendedora" | "cliente",
) {
  if (pedido.conferencia?.[origem] !== "falta") throw new Error("Só é possível substituir itens em falta.");
  const produto = buscarProduto(produtoId);
  const corInfo = produto?.cores.find((c) => c.nome === cor);
  if (!produto || produto.preco <= 0 || !corInfo || !produto.tamanhos.includes(tamanho)) throw new Error("Produto inválido.");
  const qtd = Math.floor(quantidade);
  if (!(qtd >= 1 && qtd <= 999)) throw new Error("Quantidade inválida.");
  if (por === "cliente") {
    // A cliente só troca o que faltou, sem aumentar o pedido, e só antes do envio
    if (!clientePodeSubstituir(pedido)) throw new Error("Este pedido já foi enviado e não pode mais ser alterado.");
    if (qtd > quantidadeSemSubstituir(pedido, origem)) throw new Error("A quantidade passa do que ficou em falta.");
  }

  await adicionarSubstituicao(pedido.id, {
    id: randomBytes(6).toString("base64url"),
    origem,
    produtoId,
    nome: produto.nome,
    referencia: produto.referencia,
    cor,
    hex: corInfo.hex,
    amostra: corInfo.amostra,
    tamanho,
    quantidade: qtd,
    preco: precoComMargem(precoDoTamanho(produto, tamanho), pedido.revendedora?.margem ?? 0),
    precoAtacado: precoDoTamanho(produto, tamanho),
    por,
    em: new Date().toISOString(),
  });
}
