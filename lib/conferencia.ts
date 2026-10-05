import "server-only";
import { randomBytes } from "crypto";
import { buscarProduto } from "@/data/produtos";
import { precoComMargem } from "@/lib/margem";
import { adicionarSubstituicao, type Pedido } from "@/lib/pedidos";

/** Valida e grava uma substituição para um item marcado como em falta. */
export async function substituirItem(
  pedido: Pedido,
  origem: string,
  produtoId: string,
  cor: string,
  tamanho: string,
  quantidade: number,
  por: "loja" | "revendedora",
) {
  if (pedido.conferencia?.[origem] !== "falta") throw new Error("Só é possível substituir itens em falta.");
  const produto = buscarProduto(produtoId);
  const corInfo = produto?.cores.find((c) => c.nome === cor);
  if (!produto || produto.preco <= 0 || !corInfo || !produto.tamanhos.includes(tamanho)) throw new Error("Produto inválido.");
  const qtd = Math.floor(quantidade);
  if (!(qtd >= 1 && qtd <= 999)) throw new Error("Quantidade inválida.");

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
    preco: precoComMargem(produto.preco, pedido.revendedora?.margem ?? 0),
    precoAtacado: produto.preco,
    por,
    em: new Date().toISOString(),
  });
}
