import "server-only";
import { createHmac, randomBytes } from "crypto";
import { iguais } from "@/lib/sessao";

// Códigos de 6 números do Google Authenticator (TOTP, RFC 6238: HMAC-SHA1, um código a cada 30 segundos).

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PERIODO = 30;

function paraBase32(buf: Buffer) {
  let bits = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  let s = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) s += ALFABETO[parseInt(bits.slice(i, i + 5), 2)];
  return s;
}

function deBase32(s: string) {
  let bits = "";
  for (const c of s.replace(/=+$/, "").toUpperCase()) bits += ALFABETO.indexOf(c).toString(2).padStart(5, "0");
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** Segredo novo (160 bits), no formato que o aplicativo lê. */
export function novoSegredo() {
  return paraBase32(randomBytes(20));
}

function codigoDoPasso(segredo: string, passo: number) {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(passo));
  const h = createHmac("sha1", deBase32(segredo)).update(contador).digest();
  const i = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(i) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

/**
 * Confere o código de 6 números. Aceita o anterior e o próximo (relógio do celular adiantado ou atrasado),
 * mas nunca um intervalo já usado. Devolve o intervalo usado, ou null.
 */
export function verificarCodigo(segredo: string, codigo: string, ultimoUsado = -1): number | null {
  const c = codigo.replace(/\D/g, "");
  if (c.length !== 6) return null;
  const agora = Math.floor(Date.now() / 1000 / PERIODO);
  for (const passo of [agora - 1, agora, agora + 1]) {
    if (passo > ultimoUsado && iguais(codigoDoPasso(segredo, passo), c)) return passo;
  }
  return null;
}

/** Endereço que vira o QR code lido pelo Google Authenticator. */
export function enderecoAuthenticator(segredo: string, emissor: string, conta: string) {
  const rotulo = encodeURIComponent(`${emissor}:${conta}`);
  return `otpauth://totp/${rotulo}?secret=${segredo}&issuer=${encodeURIComponent(emissor)}&algorithm=SHA1&digits=6&period=${PERIODO}`;
}
