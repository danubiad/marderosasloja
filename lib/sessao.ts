import "server-only";
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt) as (senha: string, salt: string, tamanho: number) => Promise<Buffer>;

// Chave para assinar os cookies de sessão. Usa SESSAO_SEGREDO se existir, senão a senha do painel.
function segredo() {
  return process.env.SESSAO_SEGREDO || process.env.PAINEL_SENHA || "somente-para-testes-locais";
}

export function iguais(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Gera "valor.assinatura" para guardar num cookie. */
export function assinar(valor: string) {
  const assinatura = createHmac("sha256", segredo()).update(valor).digest("base64url");
  return `${valor}.${assinatura}`;
}

/** Devolve o valor se a assinatura for válida. */
export function verificar(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i <= 0) return null;
  const valor = token.slice(0, i);
  return iguais(assinar(valor), token) ? valor : null;
}

export async function gerarHashSenha(senha: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(senha, salt, 64)).toString("hex");
  return `${salt}:${hash}`;
}

export async function conferirSenha(senha: string, guardado: string) {
  const [salt, hash] = guardado.split(":");
  if (!salt || !hash) return false;
  const tentativa = (await scryptAsync(senha, salt, 64)).toString("hex");
  return iguais(tentativa, hash);
}
