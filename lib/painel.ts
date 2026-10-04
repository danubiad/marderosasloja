import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// A senha do painel fica na variável de ambiente PAINEL_SENHA (Vercel → Settings → Environment Variables).
// O cookie guarda só uma assinatura derivada da senha; trocar a senha desconecta todo mundo.

export const COOKIE_PAINEL = "painel";
export const DURACAO_SESSAO = 60 * 60 * 24 * 30; // 30 dias

export function painelConfigurado() {
  return Boolean(process.env.PAINEL_SENHA);
}

export function tokenSessao() {
  return createHmac("sha256", process.env.PAINEL_SENHA ?? "").update("painel-mar-de-rosas-v1").digest("hex");
}

function iguais(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function senhaCorreta(senha: string) {
  return painelConfigurado() && iguais(senha, process.env.PAINEL_SENHA ?? "");
}

export async function estaLogado() {
  if (!painelConfigurado()) return false;
  const valor = (await cookies()).get(COOKIE_PAINEL)?.value;
  return Boolean(valor) && iguais(valor!, tokenSessao());
}
