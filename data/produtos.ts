// Cadastro dos produtos do catálogo.
// Para adicionar fotos, coloque os arquivos em /public/produtos e informe o caminho em `fotos`
// (ex.: "/produtos/conjunto-renda-1.jpg"). Fotos por cor vão em `cores[].foto`.
// As bolinhas de cor usam um recorte do tecido/estampa (`cores[].amostra`), gerado com
// `npm run amostra` (veja scripts/recortar-amostra.mjs).

export type Cor = {
  nome: string;
  /** Cor da bolinha, em hexadecimal (usada enquanto não há recorte da foto) */
  hex: string;
  /** Foto opcional mostrando o produto nessa cor */
  foto?: string;
  /** Recorte do tecido ou da estampa, mostrado dentro da bolinha (ex.: "/produtos/amostras/mr-101-preto.webp") */
  amostra?: string;
};

/** Grade de tamanhos padrão de todos os produtos. */
export const TAMANHOS_PADRAO = ["P", "M", "G", "GG"];

/** Grade de tamanhos dos produtos Plus Size. */
export const TAMANHOS_PLUS = ["G1", "G2", "G3"];

/** Categorias do catálogo, na ordem em que aparecem no filtro. */
export const categorias = [
  "Conjuntos",
  "Calcinhas",
  "Kits",
  "Camisolas",
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
  preco: number;
  /** Preço antigo, para produtos em promoção */
  precoDe?: number;
  novidade?: boolean;
  fotos: string[];
  cores: Cor[];
  tamanhos: string[];
  /** Data de cadastro (AAAA-MM-DD), usada na ordenação "Mais recentes" */
  criadoEm: string;
};

export const produtos: Produto[] = [
  {
    id: "1",
    slug: "conjunto-renda-floral",
    referencia: "MR-101",
    nome: "Conjunto Renda Floral",
    descricao:
      "Conjunto em renda floral com sutiã com bojo e calcinha fio duplo. Alças reguláveis e fecho nas costas.",
    categorias: ["Conjuntos"],
    preco: 39.9,
    novidade: true,
    fotos: [],
    cores: [
      { nome: "Preto", hex: "#111111" },
      { nome: "Vinho", hex: "#6b1e2e" },
      { nome: "Nude", hex: "#e3c4a8" },
    ],
    tamanhos: TAMANHOS_PADRAO,
    criadoEm: "2026-10-01",
  },
  {
    id: "2",
    slug: "sutia-microfibra-sem-costura",
    referencia: "MR-102",
    nome: "Sutiã Microfibra Sem Costura",
    descricao: "Sutiã em microfibra com bojo bolha, sem costura, toque macio e invisível sob a roupa.",
    categorias: ["Sutiã Avulso"],
    preco: 24.9,
    fotos: [],
    cores: [
      { nome: "Preto", hex: "#111111" },
      { nome: "Branco", hex: "#f7f5f0" },
      { nome: "Nude", hex: "#e3c4a8" },
    ],
    tamanhos: TAMANHOS_PADRAO,
    criadoEm: "2026-09-20",
  },
  {
    id: "3",
    slug: "calcinha-cos-alto-renda",
    referencia: "MR-103",
    nome: "Calcinha Cós Alto Renda",
    descricao: "Calcinha cós alto com detalhe em renda na cintura. Forro em algodão.",
    categorias: ["Calcinhas"],
    preco: 12.9,
    precoDe: 15.9,
    fotos: [],
    cores: [
      { nome: "Preto", hex: "#111111" },
      { nome: "Rosa", hex: "#e8a6b4" },
      { nome: "Off White", hex: "#efe9dd" },
    ],
    tamanhos: TAMANHOS_PADRAO,
    criadoEm: "2026-09-10",
  },
  {
    id: "4",
    slug: "camisola-renda-decote",
    referencia: "MR-104",
    nome: "Camisola Renda Decote V",
    descricao: "Camisola curta em renda com decote V profundo e alças finas reguláveis.",
    categorias: ["Camisolas"],
    preco: 54.9,
    novidade: true,
    fotos: [],
    cores: [
      { nome: "Preto", hex: "#111111" },
      { nome: "Vermelho", hex: "#a3101f" },
    ],
    tamanhos: TAMANHOS_PADRAO,
    criadoEm: "2026-09-28",
  },
  {
    id: "5",
    slug: "pijama-short-doll-cetim",
    referencia: "MR-105",
    nome: "Short Doll Cetim",
    descricao: "Short doll em cetim com acabamento em renda. Blusa com alça regulável.",
    categorias: ["Pijama"],
    preco: 44.9,
    precoDe: 52.9,
    fotos: [],
    cores: [
      { nome: "Champagne", hex: "#e8d5a3" },
      { nome: "Rosê", hex: "#d9a0a0" },
      { nome: "Preto", hex: "#111111" },
    ],
    tamanhos: TAMANHOS_PADRAO,
    criadoEm: "2026-08-30",
  },
  {
    id: "6",
    slug: "kit-3-calcinhas-algodao",
    referencia: "MR-106",
    nome: "Kit 3 Calcinhas Algodão",
    descricao: "Kit com 3 calcinhas em algodão com elastano, modelo tradicional, cores sortidas.",
    categorias: ["Kits", "Calcinhas"],
    preco: 19.9,
    fotos: [],
    cores: [{ nome: "Sortido", hex: "#c9a55a" }],
    tamanhos: TAMANHOS_PADRAO,
    criadoEm: "2026-08-15",
  },
];

export function buscarProduto(id: string) {
  return produtos.find((p) => p.id === id);
}

export function buscarProdutoPorSlug(slug: string) {
  return produtos.find((p) => p.slug === slug);
}
