import { buscarProduto, type Produto } from "@/data/produtos";
import { buscarCupom, formasEntrega } from "@/lib/config";

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
  subtotal: number;
};

export function calcularResumo(itens: Itens, codigoCupom?: string, entregaId?: string) {
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
    if (pecas > 0) linhas.push({ produto, grade: gradeValida, pecas, subtotal: pecas * produto.preco });
  }

  const pecas = linhas.reduce((acc, l) => acc + l.pecas, 0);
  const subtotal = linhas.reduce((acc, l) => acc + l.subtotal, 0);
  const cupom = codigoCupom ? buscarCupom(codigoCupom) : undefined;
  const desconto = cupom ? Math.round(subtotal * cupom.percentual) / 100 : 0;
  const entrega = formasEntrega.find((f) => f.id === entregaId);
  const frete = entrega?.valor ?? 0;

  return {
    linhas,
    pecas,
    subtotal,
    cupom,
    desconto,
    entrega,
    frete,
    total: subtotal - desconto + frete,
  };
}
