import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import type { Grade } from "@/lib/calculo";

export type ItemPedido = {
  produtoId: string;
  referencia: string;
  nome: string;
  foto?: string;
  preco: number;
  cores: { nome: string; hex: string; amostra?: string }[];
  tamanhos: string[];
  grade: Grade;
  pecas: number;
  subtotal: number;
};

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
  /** Andamento do pedido, alterado pelo painel. Pedidos antigos sem status contam como "novo". */
  status?: StatusPedido;
};

export const statusPedido = {
  novo: "Novo",
  separando: "Em separação",
  enviado: "Enviado",
  concluido: "Concluído",
  cancelado: "Cancelado",
} as const;

export type StatusPedido = keyof typeof statusPedido;

// Em produção (Vercel) os pedidos ficam no Upstash Redis.
// Sem as variáveis de ambiente, usa um arquivo local (apenas para testes no computador).
const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
    : process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? Redis.fromEnv()
      : null;

const ARQUIVO = path.join(process.cwd(), ".data", "pedidos.json");
const NUMERO_INICIAL = 1000;

async function lerArquivo(): Promise<Pedido[]> {
  try {
    return JSON.parse(await fs.readFile(ARQUIVO, "utf8"));
  } catch {
    return [];
  }
}

export async function proximoNumero(): Promise<number> {
  if (redis) return NUMERO_INICIAL + (await redis.incr("pedidos:numero"));
  const pedidos = await lerArquivo();
  return NUMERO_INICIAL + pedidos.length + 1;
}

export async function salvarPedido(pedido: Pedido) {
  if (redis) {
    await redis.set(`pedido:${pedido.id}`, pedido);
    await redis.lpush("pedidos", pedido.id);
    return;
  }
  if (process.env.VERCEL) throw new Error("Banco de dados de pedidos não configurado");
  const pedidos = await lerArquivo();
  pedidos.push(pedido);
  await fs.mkdir(path.dirname(ARQUIVO), { recursive: true });
  await fs.writeFile(ARQUIVO, JSON.stringify(pedidos, null, 2));
}

export async function buscarPedido(id: string): Promise<Pedido | null> {
  if (redis) return await redis.get<Pedido>(`pedido:${id}`);
  const pedidos = await lerArquivo();
  return pedidos.find((p) => p.id === id) ?? null;
}

/** Pedidos do mais recente para o mais antigo. */
export async function listarPedidos(limite = 500): Promise<Pedido[]> {
  if (redis) {
    const ids = await redis.lrange<string>("pedidos", 0, limite - 1);
    if (ids.length === 0) return [];
    const pedidos = await redis.mget<(Pedido | null)[]>(...ids.map((id) => `pedido:${id}`));
    return pedidos.filter((p): p is Pedido => p !== null);
  }
  const pedidos = await lerArquivo();
  return pedidos.reverse().slice(0, limite);
}

export async function atualizarStatus(id: string, status: StatusPedido) {
  if (redis) {
    const pedido = await redis.get<Pedido>(`pedido:${id}`);
    if (!pedido) return;
    await redis.set(`pedido:${id}`, { ...pedido, status });
    return;
  }
  const pedidos = await lerArquivo();
  const pedido = pedidos.find((p) => p.id === id);
  if (!pedido) return;
  pedido.status = status;
  await fs.writeFile(ARQUIVO, JSON.stringify(pedidos, null, 2));
}
