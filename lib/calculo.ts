import { buscarProduto, type Produto } from "@/data/produtos";
import { buscarCupom, formasEntrega, formasEntregaRevendedora } from "@/lib/config";
import { precoComMargem } from "@/lib/margem";

/** Quantidades de um produto, indexadas por chave "cor|tamanho". */
export type Grade = Record<string, number>;

/** Carrinho: produtoId -> grade de quantidades. */
export type Itens = Record<string, Grade>;

export function chaveGrade(cor: string, tamanho: string) {
  return `${cor}|${tamanho}`;
}

export function totalPecas(grade: Grade) {
  return Object.values(grade).reduce((acc, q) => acc + q, 0);
}

export type LinhaResumo = {
  produto: Produto;
  grade: Grade;
  pecas: number;
  /** Preço cobrado da cliente (com margem no catálogo da revendedora) */
  preco: number;
  precoAtacado: number;
  subtotal: number;
};

export type OpcoesResumo = {
  codigoCupom?: string;
  entregaId?: string;
  /** Catálogo de revendedora: aplica a margem, sem cupom e com entrega combinada */
  revendedora?: { margem: number };
};

export function entregasDisponiveis(revendedora?: boolean) {
  return revendedora ? formasEntregaRevendedora : formasEntrega;
}

export function calcularResumo(itens: Itens, opcoes: OpcoesResumo = {}) {
  const margem = opcoes.revendedora?.margem ?? 0;
  const linhas: LinhaResumo[] = [];
  for (const [id, grade] of Object.entries(itens)) {
    const produto = buscarProduto(id);
    // Produtos sem preço definido ainda não podem ser pedidos
    if (!produto || produto.preco <= 0) continue;
    // Ignora combinações que não existem mais no cadastro
    const gradeValida: Grade = {};
    for (const cor of produto.cores) {
      for (const tam of produto.tamanhos) {
        const q = Math.floor(grade[chaveGrade(cor.nome, tam)] ?? 0);
        if (q > 0) gradeValida[chaveGrade(cor.nome, tam)] = q;
      }
    }
    const pecas = totalPecas(gradeValida);
    const preco = precoComMargem(produto.preco, margem);
    if (pecas > 0) linhas.push({ produto, grade: gradeValida, pecas, preco, precoAtacado: produto.preco, subtotal: pecas * preco });
  }

  const pecas = linhas.reduce((acc, l) => acc + l.pecas, 0);
  const subtotal = linhas.reduce((acc, l) => acc + l.subtotal, 0);
  const totalAtacado = linhas.reduce((acc, l) => acc + l.pecas * l.precoAtacado, 0);
  const cupom = opcoes.codigoCupom && !opcoes.revendedora ? buscarCupom(opcoes.codigoCupom) : undefined;
  const desconto = cupom ? Math.round(subtotal * cupom.percentual) / 100 : 0;
  const entrega = entregasDisponiveis(Boolean(opcoes.revendedora)).find((f) => f.id === opcoes.entregaId);
  const frete = entrega?.valor ?? 0;

  return {
    linhas,
    pecas,
    subtotal,
    totalAtacado,
    cupom,
    desconto,
    entrega,
    frete,
    total: subtotal - desconto + frete,
  };
}
