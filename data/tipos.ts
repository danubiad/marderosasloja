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

/** Categorias do catálogo, na ordem em que aparecem no filtro. */
export const categorias = [
  "Conjuntos",
  "Calcinhas",
  "Kits",
  "Camisolas",
  "Robes",
  "Baby Doll",
  "Pijama",
  "Cueca",
  "Sutiã Avulso",
  "Plus Size",
] as const;

export type Categoria = (typeof categorias)[number];

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
  novidade?: boolean;
  fotos: string[];
  /** Vídeos do produto (mostrados na página do produto e no feed de vídeos) */
  videos?: Video[];
  cores: Cor[];
  tamanhos: string[];
  /** Data de cadastro (AAAA-MM-DD), usada na ordenação "Mais recentes" */
  criadoEm: string;
};
