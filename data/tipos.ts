export type Cor = {
  nome: string;
  /** Cor da bolinha, em hexadecimal (usada enquanto não há recorte da foto) */
  hex: string;
  /** Foto mostrando o produto nessa cor */
  foto?: string;
  /** Recorte do tecido ou da estampa, mostrado dentro da bolinha */
  amostra?: string;
};

export type Video = {
  src: string;
  /** Imagem mostrada antes do vídeo começar */
  capa: string;
};

/** Grade de tamanhos padrão de todos os produtos. */
export const TAMANHOS_PADRAO = ["P", "M", "G", "GG"];

/** Grade de tamanhos dos produtos Plus Size. */
export const TAMANHOS_PLUS = ["48", "50", "52", "54"];

/** Grade de tamanhos infantil. */
export const TAMANHOS_INFANTIL = ["PP", "P", "M", "G", "GG", "XG"];

/** Idade de cada tamanho infantil, mostrada embaixo do tamanho na grade. */
export const IDADES_INFANTIL: Record<string, string> = {
  PP: "2 a 4 anos",
  P: "4 a 6 anos",
  M: "6 a 8 anos",
  G: "8 a 10 anos",
  GG: "10 a 12 anos",
  XG: "12 a 14 anos",
};

/** Opções dos kits de 10 calcinhas: as cores vêm variadas, a cliente escolhe só a combinação de tamanhos. */
export const TAMANHOS_KIT_CALCINHAS = ["2P 3M 3G 2GG", "3M 4G 3GG", "10 P", "10 M", "10 G", "10 GG", "Outro"];

export const LEGENDAS_KIT_CALCINHAS: Record<string, string> = {
  "10 P": "todas P",
  "10 M": "todas M",
  "10 G": "todas G",
  "10 GG": "todas GG",
  Outro: "informar pelo WhatsApp",
};

/** Categorias do catálogo, na ordem em que aparecem no filtro. */
export const categorias = [
  "Conjuntos",
  "Calcinhas",
  "Kits",
  "Camisolas",
  "Robes",
  "Baby Doll",
  "Baby Doll Infantil",
  "Pijama",
  "Cueca",
  "Sutiã Avulso",
  "Plus Size",
] as const;

export type Categoria = (typeof categorias)[number];

/** Preço de um tamanho: o de `precosTamanho`, se houver, senão o preço do produto. */
export function precoDoTamanho(p: { preco: number; precosTamanho?: Record<string, number> }, tamanho: string) {
  return p.precosTamanho?.[tamanho] ?? p.preco;
}

/** Valor de uma grade "cor|tamanho" → quantidade, respeitando o preço de cada tamanho. */
export function valorDaGrade(p: { preco: number; precosTamanho?: Record<string, number> }, grade: Record<string, number>) {
  return Object.entries(grade).reduce((acc, [chave, q]) => acc + q * precoDoTamanho(p, chave.split("|")[1]), 0);
}

export type Produto = {
  id: string;
  slug: string;
  referencia: string;
  nome: string;
  descricao: string;
  /** Um produto pode estar em mais de uma categoria (ex.: ["Conjuntos", "Plus Size"]) */
  categorias: Categoria[];
  /** Preço de atacado. 0 = preço ainda não definido (produto aparece, mas não pode ser pedido) */
  preco: number;
  /** Preço antigo, para produtos em promoção */
  precoDe?: number;
  /** Preço de atacado diferente em alguns tamanhos (ex.: infantil mais barato no Pijama Mãe e Filha); os outros usam `preco` */
  precosTamanho?: Record<string, number>;
  novidade?: boolean;
  fotos: string[];
  /** Vídeos do produto (mostrados na página do produto e no feed de vídeos) */
  videos?: Video[];
  cores: Cor[];
  tamanhos: string[];
  /** Texto curto embaixo de cada tamanho na grade (ex.: idade nos infantis) */
  legendaTamanhos?: Record<string, string>;
  /** Data de cadastro (AAAA-MM-DD), usada na ordenação "Mais recentes" */
  criadoEm: string;
};
