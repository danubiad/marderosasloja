import "server-only";
import { randomBytes } from "crypto";
import { buscarProduto, precoDoTamanho } from "@/data/produtos";
import { aplicarPreco, disponivel } from "@/lib/disponibilidade";
import { buscarDisponibilidade } from "@/lib/estoque";
import { precoComMargem } from "@/lib/margem";
import {
  adicionarSubstituicao,
  chaveConferencia,
  clientePodeSubstituir,
  mudarQuantidade,
  ORIGEM_ACRESCIMO,
  quantidadeSemSubstituir,
  type Pedido,
} from "@/lib/pedidos";

function validarQuantidade(quantidade: number) {
  const qtd = Math.floor(quantidade);
  if (!(qtd >= 1 && qtd <= 999)) throw new Error("Quantidade inválida.");
  return qtd;
}

/** Confere produto, cor, tamanho e estoque, e grava a peça (substituição ou acréscimo) no pedido. */
async function gravarPeca(
  pedido: Pedido,
  origem: string,
  produtoId: string,
  cor: string,
  tamanho: string,
  qtd: number,
  por: "loja" | "revendedora" | "cliente",
) {
  const d = await buscarDisponibilidade();
  const cadastro = buscarProduto(produtoId);
  const produto = cadastro && aplicarPreco(cadastro, d[produtoId]);
  const corInfo = produto?.cores.find((c) => c.nome === cor);
  if (!produto || produto.preco <= 0 || !corInfo || !produto.tamanhos.includes(tamanho)) throw new Error("Produto inválido.");
  if (!disponivel(d, produtoId, cor, tamanho) || cadastro?.esgotados?.includes(`${cor}|${tamanho}`)) throw new Error("Essa cor e tamanho estão esgotados.");

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
  const qtd = validarQuantidade(quantidade);
  if (por === "cliente") {
    // A cliente só troca o que faltou, sem aumentar o pedido, e só antes do envio
    if (!clientePodeSubstituir(pedido)) throw new Error("Este pedido já foi enviado e não pode mais ser alterado.");
    if (qtd > quantidadeSemSubstituir(pedido, origem)) throw new Error("A quantidade passa do que ficou em falta.");
  }
  await gravarPeca(pedido, origem, produtoId, cor, tamanho, qtd, por);
}

/** A vendedora (loja ou revendedora) acrescenta uma peça nova ao pedido. */
export async function acrescentarItem(
  pedido: Pedido,
  produtoId: string,
  cor: string,
  tamanho: string,
  quantidade: number,
  por: "loja" | "revendedora",
) {
  if (por === "revendedora" && !clientePodeSubstituir(pedido)) throw new Error("Este pedido já foi enviado e não pode mais ser alterado.");
  await gravarPeca(pedido, ORIGEM_ACRESCIMO, produtoId, cor, tamanho, validarQuantidade(quantidade), por);
}

/** A vendedora muda a quantidade de uma linha do pedido; 0 remove. */
export async function alterarQuantidade(pedido: Pedido, chave: string, quantidade: number, por: "loja" | "revendedora") {
  const qtd = Math.floor(quantidade);
  if (!(qtd >= 0 && qtd <= 999)) throw new Error("Quantidade inválida.");
  if (por === "revendedora") {
    if (!clientePodeSubstituir(pedido)) throw new Error("Este pedido já foi enviado e não pode mais ser alterado.");
    // Depois que a loja separou a peça (✓), só a loja muda; a em falta (✕) a revendedora pode tirar
    if (pedido.conferencia?.[chave] === "ok") throw new Error("Essa peça já foi separada pela loja.");
  }
  const valida = chave.startsWith("sub:")
    ? (pedido.substituicoes ?? []).some((s) => chaveConferencia.substituicao(s.id) === chave)
    : pedido.itens.some((i) =>
        Object.keys(i.grade).some((cg) => {
          const [cor, tam] = cg.split("|");
          return chaveConferencia.item(i.produtoId, cor, tam) === chave;
        }),
      );
  if (!valida) throw new Error("Item inválido.");
  await mudarQuantidade(pedido.id, chave, qtd);
}
