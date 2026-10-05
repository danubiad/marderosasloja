// Tipos e cálculos de pedido que podem ser usados tanto no servidor quanto no navegador.
import type { Grade } from "@/lib/calculo";

export type ItemPedido = {
  produtoId: string;
  referencia: string;
  nome: string;
  foto?: string;
  /** Preço cobrado da cliente (com a margem, se for pedido de revendedora) */
  preco: number;
  /** Preço de atacado da loja */
  precoAtacado?: number;
  cores: { nome: string; hex: string; amostra?: string }[];
  tamanhos: string[];
  legendaTamanhos?: Record<string, string>;
  grade: Grade;
  pecas: number;
  subtotal: number;
};

/** ok = separado (✓ verde); falta = em falta (✗ vermelho) */
export type Conferencia = "ok" | "falta";

export type Substituicao = {
  id: string;
  /** Chave do item em falta que está sendo substituído */
  origem: string;
  produtoId: string;
  nome: string;
  referencia: string;
  cor: string;
  hex: string;
  amostra?: string;
  tamanho: string;
  quantidade: number;
  preco: number;
  precoAtacado: number;
  /** Quem fez a substituição */
  por: "loja" | "revendedora" | "cliente";
  em: string;
};

export type RevendedoraPedido = { usuario: string; nome: string; whatsapp: string; margem: number };

export type Pedido = {
  id: string;
  numero: number;
  criadoEm: string;
  cliente: {
    nome: string;
    documento: string;
    telefone: string;
  };
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  entrega: { id: string; titulo: string; valor: number };
  itens: ItemPedido[];
  observacao: string;
  cupom?: string;
  pecas: number;
  subtotal: number;
  desconto: number;
  frete: number;
  total: number;
  /** Valor do pedido no preço de atacado (pedidos de revendedora) */
  totalAtacado?: number;
  /** Andamento do pedido, alterado pelo painel. Pedidos antigos sem status contam como "novo". */
  status?: StatusPedido;
  /** Pedido feito pelo catálogo de uma revendedora */
  revendedora?: RevendedoraPedido;
  /** Marcas de conferência por item: chave -> ok/falta */
  conferencia?: Record<string, Conferencia>;
  substituicoes?: Substituicao[];
};

export const statusPedido = {
  novo: "Novo",
  separando: "Em separação",
  enviado: "Enviado",
  concluido: "Concluído",
  cancelado: "Cancelado",
} as const;

export type StatusPedido = keyof typeof statusPedido;

export const chaveConferencia = {
  item: (produtoId: string, cor: string, tamanho: string) => `${produtoId}|${cor}|${tamanho}`,
  substituicao: (subId: string) => `sub:${subId}`,
};

/** A cliente pode trocar as peças em falta enquanto o pedido não foi enviado. */
export function clientePodeSubstituir(p: Pedido) {
  const status = p.status ?? "novo";
  return status === "novo" || status === "separando";
}

/** Quantas peças de um item em falta ainda não foram substituídas. */
export function quantidadeSemSubstituir(p: Pedido, origem: string) {
  const [produtoId, cor, tamanho] = origem.split("|");
  const item = p.itens.find((i) => i.produtoId === produtoId);
  const original = item?.grade[`${cor}|${tamanho}`] ?? 0;
  const substituidas = (p.substituicoes ?? []).filter((s) => s.origem === origem).reduce((t, s) => t + s.quantidade, 0);
  return Math.max(0, original - substituidas);
}

/** Totais do pedido considerando os itens em falta e as substituições. */
export function resumoConferencia(p: Pedido) {
  const conf = p.conferencia ?? {};
  let pecas = 0;
  let subtotal = 0;
  let atacado = 0;
  let faltas = 0;
  let conferidos = 0;
  let totalLinhas = 0;

  for (const item of p.itens) {
    for (const [chave, q] of Object.entries(item.grade)) {
      const [cor, tam] = chave.split("|");
      const marca = conf[chaveConferencia.item(item.produtoId, cor, tam)];
      totalLinhas++;
      if (marca) conferidos++;
      if (marca === "falta") {
        faltas += q;
        continue;
      }
      pecas += q;
      subtotal += q * item.preco;
      atacado += q * (item.precoAtacado ?? item.preco);
    }
  }
  for (const s of p.substituicoes ?? []) {
    const marca = conf[chaveConferencia.substituicao(s.id)];
    totalLinhas++;
    if (marca) conferidos++;
    if (marca === "falta") {
      faltas += s.quantidade;
      continue;
    }
    pecas += s.quantidade;
    subtotal += s.quantidade * s.preco;
    atacado += s.quantidade * s.precoAtacado;
  }

  const desconto = p.subtotal > 0 ? Math.round(subtotal * (p.desconto / p.subtotal) * 100) / 100 : 0;
  const alterado = Boolean(p.substituicoes?.length) || Object.values(conf).includes("falta");
  return {
    pecas,
    subtotal,
    atacado,
    desconto,
    total: subtotal - desconto + p.frete,
    faltas,
    conferidos,
    totalLinhas,
    alterado,
  };
}
