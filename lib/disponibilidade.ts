// O que está ativo ou esgotado em cada produto e o preço editado, marcados pela dona na aba Produtos do painel.
// Pode ser usado no servidor e no navegador (não tem custo nem nada privado).
import type { Produto } from "@/data/tipos";

export type DisponibilidadeProduto = {
  /** Produto fora do catálogo */
  inativo?: boolean;
  /** Cores que saem do produto */
  coresInativas?: string[];
  /** Tamanhos que saem do produto (em todas as cores) */
  tamanhosInativos?: string[];
  /** Combinações "cor|tamanho" esgotadas: aparecem na grade, mas não podem ser pedidas */
  esgotados?: string[];
  /** Preço cheio editado no painel (vale no lugar do de data/catalogo.ts) */
  preco?: number;
  /** Preço promocional: o cheio aparece riscado e o produto vai para Promoções */
  precoPromocional?: number;
};

/** produtoId -> o que está desligado nele */
export type Disponibilidade = Record<string, DisponibilidadeProduto>;

/** Se a combinação cor + tamanho do produto pode ser pedida. */
export function disponivel(d: Disponibilidade, produtoId: string, cor: string, tamanho: string) {
  const p = d[produtoId];
  if (!p) return true;
  return (
    !p.inativo &&
    !p.coresInativas?.includes(cor) &&
    !p.tamanhosInativos?.includes(tamanho) &&
    !p.esgotados?.includes(`${cor}|${tamanho}`)
  );
}

/** Preço cheio e promocional do produto, do jeito que a dona edita no painel. */
export function precosDoProduto(p: Pick<Produto, "preco" | "precoDe">) {
  const promocao = p.precoDe !== undefined && p.precoDe > p.preco;
  return { preco: promocao ? p.precoDe! : p.preco, precoPromocional: promocao ? p.preco : undefined };
}

/** Usa o preço editado no painel; com promocional, o cheio vira o preço riscado (precoDe).
 *  Produto com preço por tamanho continua com o preço do cadastro. */
export function aplicarPreco<P extends Produto>(produto: P, p: DisponibilidadeProduto | undefined): P {
  if (p?.preco === undefined || produto.precosTamanho) return produto;
  return p.precoPromocional
    ? { ...produto, preco: p.precoPromocional, precoDe: p.preco }
    : { ...produto, preco: p.preco, precoDe: undefined };
}

/** Tira os produtos, cores e tamanhos desligados, marca as combinações esgotadas e aplica o preço do painel. */
export function aplicarDisponibilidade<P extends Produto>(lista: P[], d: Disponibilidade): P[] {
  return lista.flatMap((original) => {
    const p = d[original.id];
    if (!p) return [original];
    if (p.inativo) return [];
    const produto = aplicarPreco(original, p);
    const cores = produto.cores.filter((c) => !p.coresInativas?.includes(c.nome));
    const tamanhos = produto.tamanhos.filter((t) => !p.tamanhosInativos?.includes(t));
    if (cores.length === 0 || tamanhos.length === 0) return [];
    const esgotados = [...(original.esgotados ?? []), ...(p.esgotados ?? [])];
    return [{ ...produto, cores, tamanhos, esgotados: esgotados.length ? esgotados : undefined }];
  });
}
