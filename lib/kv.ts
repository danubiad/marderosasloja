import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

// Armazenamento chave-valor. Em produção (Vercel) usa o Upstash Redis;
// sem as variáveis de ambiente, usa um arquivo local (apenas para testes no computador).
const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
    : process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? Redis.fromEnv()
      : null;

const ARQUIVO = path.join(process.cwd(), ".data", "kv.json");
type Banco = Record<string, unknown>;

async function ler(): Promise<Banco> {
  try {
    return JSON.parse(await fs.readFile(ARQUIVO, "utf8"));
  } catch {
    return {};
  }
}

// Serializa escritas locais para não perder dados com requisições simultâneas
let fila: Promise<unknown> = Promise.resolve();
function alterar<T>(fn: (db: Banco) => T): Promise<T> {
  const tarefa = fila.then(async () => {
    if (process.env.VERCEL) throw new Error("Banco de dados não configurado");
    const db = await ler();
    const r = fn(db);
    await fs.mkdir(path.dirname(ARQUIVO), { recursive: true });
    await fs.writeFile(ARQUIVO, JSON.stringify(db, null, 1));
    return r;
  });
  fila = tarefa.catch(() => {});
  return tarefa;
}

export const kv = {
  async get<T>(chave: string): Promise<T | null> {
    if (redis) return await redis.get<T>(chave);
    return ((await ler())[chave] as T) ?? null;
  },

  async set(chave: string, valor: unknown) {
    if (redis) return void (await redis.set(chave, valor));
    await alterar((db) => void (db[chave] = valor));
  },

  async del(chave: string) {
    if (redis) return void (await redis.del(chave));
    await alterar((db) => void delete db[chave]);
  },

  async mget<T>(chaves: string[]): Promise<(T | null)[]> {
    if (!chaves.length) return [];
    if (redis) return await redis.mget<(T | null)[]>(...chaves);
    const db = await ler();
    return chaves.map((c) => (db[c] as T) ?? null);
  },

  async incr(chave: string): Promise<number> {
    if (redis) return await redis.incr(chave);
    return alterar((db) => (db[chave] = Number(db[chave] ?? 0) + 1) as number);
  },

  /** Adiciona no início de uma lista. */
  async lpush(chave: string, valor: string) {
    if (redis) return void (await redis.lpush(chave, valor));
    await alterar((db) => void (db[chave] = [valor, ...((db[chave] as string[]) ?? [])]));
  },

  async lrange(chave: string, inicio = 0, fim = -1): Promise<string[]> {
    if (redis) return await redis.lrange<string>(chave, inicio, fim);
    const lista = ((await ler())[chave] as string[]) ?? [];
    return lista.slice(inicio, fim === -1 ? undefined : fim + 1);
  },

  /** Adiciona a um conjunto (sem repetição). */
  async sadd(chave: string, valor: string) {
    if (redis) return void (await redis.sadd(chave, valor));
    await alterar((db) => {
      const s = new Set((db[chave] as string[]) ?? []);
      s.add(valor);
      db[chave] = [...s];
    });
  },

  async smembers(chave: string): Promise<string[]> {
    if (redis) return await redis.smembers(chave);
    return ((await ler())[chave] as string[]) ?? [];
  },
};
