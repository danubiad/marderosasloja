// O que está ativo ou esgotado em cada produto, marcado pela dona na aba Produtos do painel.
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

/** Tira os produtos, cores e tamanhos desligados e marca as combinações esgotadas. */
export function aplicarDisponibilidade<P extends Produto>(lista: P[], d: Disponibilidade): P[] {
  return lista.flatMap((produto) => {
    const p = d[produto.id];
    if (!p) return [produto];
    if (p.inativo) return [];
    const cores = produto.cores.filter((c) => !p.coresInativas?.includes(c.nome));
    const tamanhos = produto.tamanhos.filter((t) => !p.tamanhosInativos?.includes(t));
    if (cores.length === 0 || tamanhos.length === 0) return [];
    return [{ ...produto, cores, tamanhos, esgotados: p.esgotados?.length ? p.esgotados : undefined }];
  });
}
