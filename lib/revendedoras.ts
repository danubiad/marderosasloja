import "server-only";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { kv } from "@/lib/kv";
import { assinar, verificar } from "@/lib/sessao";

export const SENHA_MINIMA = 8;

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
  /** Foto ou logo enviada pela revendedora (a imagem fica em `revendedora-foto:<usuario>`) */
  foto?: { versao: number; tipo: TipoFoto };
  /** Versão da sessão: sobe ao trocar a senha ou sair, e desconecta todos os aparelhos */
  sessao?: number;
  /** Quando ela pediu senha nova em "Esqueci minha senha" (aparece no painel da loja) */
  pedidoSenha?: string;
};

/** "foto": rosto, recortada em círculo; "logo": aparece inteira, sem cortar. */
export type TipoFoto = "foto" | "logo";

/** Dados públicos, seguros para enviar ao navegador. */
export type RevendedoraPublica = Pick<Revendedora, "usuario" | "nome" | "whatsapp" | "margem"> & {
  /** Endereço da foto/logo, se ela enviou */
  foto?: string;
  tipoFoto?: TipoFoto;
};

export const COOKIE_REVENDEDORA = "revendedora";
export const DURACAO_SESSAO_REVENDEDORA = 60 * 60 * 24 * 60; // 60 dias

/** Nomes que não podem ser usados como endereço do catálogo. */
const RESERVADOS = new Set(["admin", "painel", "loja", "marderosas", "api", "revendedora", "mar-de-rosas"]);

export function usuarioValido(usuario: string) {
  return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(usuario) && !RESERVADOS.has(usuario);
}

export function enderecoFoto(r: Revendedora) {
  return r.foto ? `/api/revendedora-foto/${r.usuario}?v=${r.foto.versao}` : undefined;
}

export function publica(r: Revendedora): RevendedoraPublica {
  return { usuario: r.usuario, nome: r.nome, whatsapp: r.whatsapp, margem: r.margem, foto: enderecoFoto(r), tipoFoto: r.foto?.tipo };
}

/** Foto/logo da revendedora em JPG, guardada em base64. */
export function buscarImagemFoto(usuario: string) {
  return kv.get<string>(`revendedora-foto:${usuario}`);
}

export async function salvarImagemFoto(usuario: string, jpgBase64: string | null) {
  if (jpgBase64) await kv.set(`revendedora-foto:${usuario}`, jpgBase64);
  else await kv.del(`revendedora-foto:${usuario}`);
}

export function buscarRevendedora(usuario: string) {
  return kv.get<Revendedora>(`revendedora:${usuario}`);
}

/** Revendedora com catálogo no ar (aprovação é automática: só as bloqueadas ficam fora). */
export async function buscarRevendedoraAtiva(usuario: string) {
  const r = await buscarRevendedora(usuario);
  return r && r.status !== "bloqueada" ? r : null;
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

/** Revendedora logada (pelo cookie), ou null. O cookie vale só na versão de sessão atual dela. */
export async function revendedoraLogada() {
  const valor = verificar((await cookies()).get(COOKIE_REVENDEDORA)?.value);
  if (!valor) return null;
  const [usuario, versao = "0"] = valor.split(":"); // cookies antigos: só o usuário (versão 0)
  const r = await buscarRevendedora(usuario);
  return r && r.status !== "bloqueada" && String(r.sessao ?? 0) === versao ? r : null;
}

export async function iniciarSessaoRevendedora(r: Pick<Revendedora, "usuario" | "sessao">) {
  (await cookies()).set(COOKIE_REVENDEDORA, assinar(`${r.usuario}:${r.sessao ?? 0}`), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SESSAO_REVENDEDORA,
  });
}

/** Sai e desconecta todos os aparelhos dela. */
export async function encerrarSessaoRevendedora() {
  const r = await revendedoraLogada();
  if (r) await salvarRevendedora({ ...r, sessao: (r.sessao ?? 0) + 1 });
  (await cookies()).delete({ name: COOKIE_REVENDEDORA, path: "/" });
}

// Link de nova senha: a loja manda pelo WhatsApp; vale 1 hora e uma vez só.
// No banco fica só o resumo (hash) do código, nunca o código do link.
const DURACAO_LINK_SENHA = 60 * 60;
const chaveLinkSenha = (codigo: string) => `revendedora-senha:${createHash("sha256").update(codigo).digest("hex")}`;

export async function criarLinkNovaSenha(usuario: string) {
  const codigo = randomBytes(24).toString("base64url");
  await kv.setExpira(chaveLinkSenha(codigo), usuario, DURACAO_LINK_SENHA);
  return codigo;
}

export function usuarioDoLinkSenha(codigo: string) {
  return codigo ? kv.get<string>(chaveLinkSenha(codigo)) : Promise.resolve(null);
}

export async function usarLinkSenha(codigo: string) {
  const usuario = await usuarioDoLinkSenha(codigo);
  if (usuario) await kv.del(chaveLinkSenha(codigo));
  return usuario;
}
