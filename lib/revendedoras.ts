import "server-only";
import { cookies } from "next/headers";
import { kv } from "@/lib/kv";
import { assinar, verificar } from "@/lib/sessao";

export type StatusRevendedora = "pendente" | "ativa" | "bloqueada";

export type Revendedora = {
  usuario: string;
  nome: string;
  whatsapp: string;
  /** Margem em % sobre o preço de atacado */
  margem: number;
  senhaHash: string;
  status: StatusRevendedora;
  criadoEm: string;
};

/** Dados públicos, seguros para enviar ao navegador. */
export type RevendedoraPublica = Pick<Revendedora, "usuario" | "nome" | "whatsapp" | "margem">;

export const COOKIE_REVENDEDORA = "revendedora";
export const DURACAO_SESSAO_REVENDEDORA = 60 * 60 * 24 * 60; // 60 dias

/** Nomes que não podem ser usados como endereço do catálogo. */
const RESERVADOS = new Set(["admin", "painel", "loja", "marderosas", "api", "revendedora", "mar-de-rosas"]);

export function usuarioValido(usuario: string) {
  return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(usuario) && !RESERVADOS.has(usuario);
}

export function publica(r: Revendedora): RevendedoraPublica {
  return { usuario: r.usuario, nome: r.nome, whatsapp: r.whatsapp, margem: r.margem };
}

export function buscarRevendedora(usuario: string) {
  return kv.get<Revendedora>(`revendedora:${usuario}`);
}

/** Revendedora ativa (para mostrar o catálogo público). */
export async function buscarRevendedoraAtiva(usuario: string) {
  const r = await buscarRevendedora(usuario);
  return r?.status === "ativa" ? r : null;
}

export async function listarRevendedoras() {
  const usuarios = await kv.smembers("revendedoras");
  const lista = await kv.mget<Revendedora>(usuarios.map((u) => `revendedora:${u}`));
  return lista.filter((r): r is Revendedora => r !== null).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function salvarRevendedora(r: Revendedora) {
  await kv.set(`revendedora:${r.usuario}`, r);
  await kv.sadd("revendedoras", r.usuario);
}

/** Revendedora logada (pelo cookie), ou null. */
export async function revendedoraLogada() {
  const usuario = verificar((await cookies()).get(COOKIE_REVENDEDORA)?.value);
  if (!usuario) return null;
  const r = await buscarRevendedora(usuario);
  return r && r.status !== "bloqueada" ? r : null;
}

export async function iniciarSessaoRevendedora(usuario: string) {
  (await cookies()).set(COOKIE_REVENDEDORA, assinar(usuario), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SESSAO_REVENDEDORA,
  });
}

export async function encerrarSessaoRevendedora() {
  (await cookies()).delete({ name: COOKIE_REVENDEDORA, path: "/" });
}
