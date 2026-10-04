"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { COOKIE_PAINEL, DURACAO_SESSAO, estaLogado, senhaCorreta, tokenSessao } from "@/lib/painel";
import { atualizarStatus, statusPedido, type StatusPedido } from "@/lib/pedidos";

export async function entrar(_estado: string, formData: FormData): Promise<string> {
  const senha = String(formData.get("senha") ?? "");
  if (!senhaCorreta(senha)) {
    // Atraso para dificultar tentativas em sequência
    await new Promise((r) => setTimeout(r, 1500));
    return "Senha incorreta.";
  }
  (await cookies()).set(COOKIE_PAINEL, tokenSessao(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/painel",
    maxAge: DURACAO_SESSAO,
  });
  refresh();
  return "";
}

export async function sair() {
  (await cookies()).delete({ name: COOKIE_PAINEL, path: "/painel" });
  refresh();
}

export async function mudarStatus(id: string, status: string) {
  if (!(await estaLogado())) throw new Error("Não autorizado");
  if (!(status in statusPedido)) throw new Error("Status inválido");
  await atualizarStatus(id, status as StatusPedido);
  refresh();
}
