"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { COOKIE_PAINEL, DURACAO_SESSAO, estaLogado, senhaCorreta, tokenSessao } from "@/lib/painel";
import { substituirItem } from "@/lib/conferencia";
import { enviarCompraMeta } from "@/lib/meta-conversoes";
import { salvarMetaDiaria } from "@/lib/metas";
import { conectarMeta, desconectarMeta } from "@/lib/meta-ads";
import { diaSP } from "@/lib/datas";
import { camposRegistro, salvarRegistro, type RegistroDia } from "@/lib/diario";
import {
  atualizarStatus,
  buscarPedido,
  chaveConferencia,
  marcarItem,
  removerSubstituicao,
  statusPedido,
  type Conferencia,
  type StatusPedido,
} from "@/lib/pedidos";
import { buscarRevendedora, salvarRevendedora, type StatusRevendedora } from "@/lib/revendedoras";

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

async function exigirLogin() {
  if (!(await estaLogado())) throw new Error("Não autorizado");
}

export async function mudarStatus(id: string, status: string) {
  await exigirLogin();
  if (!(status in statusPedido)) throw new Error("Status inválido");
  const pedido = await atualizarStatus(id, status as StatusPedido);
  if (pedido) await enviarCompraMeta(pedido);
  refresh();
}

export async function mudarMetaDiaria(formData: FormData) {
  await exigirLogin();
  const valor = Number(String(formData.get("meta") ?? "").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0 || valor > 10_000_000) throw new Error("Meta inválida");
  await salvarMetaDiaria(Math.round(valor));
  refresh();
}

export async function mudarRegistroDia(formData: FormData) {
  await exigirLogin();
  const dia = String(formData.get("dia") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || dia > diaSP()) throw new Error("Dia inválido");
  const novos: RegistroDia = {};
  for (const campo of camposRegistro) {
    const texto = String(formData.get(campo) ?? "").trim();
    if (!texto) continue;
    const valor = Number(texto.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(valor) || valor < 0 || valor > 100_000_000) throw new Error("Valor inválido");
    novos[campo] = campo === "gasto" ? Math.round(valor * 100) / 100 : Math.round(valor);
  }
  await salvarRegistro(dia, novos);
  refresh();
}

export async function conectarMetaAds(_estado: string, formData: FormData): Promise<string> {
  await exigirLogin();
  const token = String(formData.get("token") ?? "").trim();
  if (token.length < 20) return "Cole o token completo.";
  const aviso = await conectarMeta(token);
  refresh();
  return aviso;
}

export async function desconectarMetaAds() {
  await exigirLogin();
  await desconectarMeta();
  refresh();
}

/** ✓ separado / ✗ em falta / null limpa a marca */
export async function marcarItemLoja(id: string, chave: string, estado: Conferencia | null) {
  await exigirLogin();
  if (estado !== null && estado !== "ok" && estado !== "falta") throw new Error("Marca inválida");
  const pedido = await buscarPedido(id);
  if (!pedido) throw new Error("Pedido não encontrado");
  const chavesValidas = new Set([
    ...pedido.itens.flatMap((i) =>
      Object.keys(i.grade).map((cg) => {
        const [cor, tam] = cg.split("|");
        return chaveConferencia.item(i.produtoId, cor, tam);
      }),
    ),
    ...(pedido.substituicoes ?? []).map((s) => chaveConferencia.substituicao(s.id)),
  ]);
  if (!chavesValidas.has(chave)) throw new Error("Item inválido");
  await marcarItem(id, chave, estado);
  refresh();
}

export async function substituirLoja(id: string, origem: string, produtoId: string, cor: string, tamanho: string, quantidade: number) {
  await exigirLogin();
  const pedido = await buscarPedido(id);
  if (!pedido) throw new Error("Pedido não encontrado");
  await substituirItem(pedido, origem, produtoId, cor, tamanho, quantidade, "loja");
  refresh();
}

export async function removerSubstituicaoLoja(id: string, subId: string) {
  await exigirLogin();
  await removerSubstituicao(id, subId);
  refresh();
}

export async function mudarStatusRevendedora(usuario: string, status: string) {
  await exigirLogin();
  if (status !== "pendente" && status !== "ativa" && status !== "bloqueada") throw new Error("Status inválido");
  const r = await buscarRevendedora(usuario);
  if (!r) throw new Error("Revendedora não encontrada");
  await salvarRevendedora({ ...r, status: status as StatusRevendedora });
  refresh();
}
