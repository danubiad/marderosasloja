"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { substituirItem } from "@/lib/conferencia";
import { somenteDigitos } from "@/lib/format";
import { kv } from "@/lib/kv";
import { MARGEM_MAXIMA } from "@/lib/margem";
import { buscarPedido, removerSubstituicao } from "@/lib/pedidos";
import {
  buscarRevendedora,
  encerrarSessaoRevendedora,
  iniciarSessaoRevendedora,
  revendedoraLogada,
  salvarRevendedora,
  usuarioValido,
} from "@/lib/revendedoras";
import { conferirSenha, gerarHashSenha } from "@/lib/sessao";

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

function lerMargem(valor: FormDataEntryValue | null) {
  const n = Number(String(valor ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= MARGEM_MAXIMA ? Math.round(n * 10) / 10 : null;
}

export async function cadastrar(_estado: string, formData: FormData): Promise<string> {
  const nome = String(formData.get("nome") ?? "").trim().slice(0, 60);
  const whatsapp = somenteDigitos(String(formData.get("whatsapp") ?? "")).slice(0, 11);
  const usuario = String(formData.get("usuario") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const margem = lerMargem(formData.get("margem"));

  if (nome.length < 3) return "Informe seu nome.";
  if (whatsapp.length < 10) return "Informe seu WhatsApp com DDD.";
  if (!usuarioValido(usuario)) return "Endereço do catálogo inválido: use de 3 a 30 letras minúsculas, números ou hífen.";
  if (senha.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
  if (margem === null) return `A margem precisa ser entre 0% e ${MARGEM_MAXIMA}%.`;
  if (await buscarRevendedora(usuario)) return "Esse endereço de catálogo já está em uso. Escolha outro.";
  if (await kv.get(`revendedora-whatsapp:${whatsapp}`)) return "Já existe um cadastro com esse WhatsApp. Use a opção Entrar.";

  await salvarRevendedora({
    usuario,
    nome,
    whatsapp,
    margem,
    senhaHash: await gerarHashSenha(senha),
    status: "pendente",
    criadoEm: new Date().toISOString(),
  });
  await kv.set(`revendedora-whatsapp:${whatsapp}`, usuario);
  await iniciarSessaoRevendedora(usuario);
  redirect("/revendedora/painel");
}

export async function entrar(_estado: string, formData: FormData): Promise<string> {
  const whatsapp = somenteDigitos(String(formData.get("whatsapp") ?? ""));
  const senha = String(formData.get("senha") ?? "");
  const usuario = await kv.get<string>(`revendedora-whatsapp:${whatsapp}`);
  const r = usuario ? await buscarRevendedora(usuario) : null;
  if (!r || !(await conferirSenha(senha, r.senhaHash))) {
    await esperar(1200);
    return "WhatsApp ou senha incorretos.";
  }
  if (r.status === "bloqueada") return "Seu cadastro está bloqueado. Fale com a Mar de Rosas.";
  await iniciarSessaoRevendedora(r.usuario);
  redirect("/revendedora/painel");
}

export async function sairRevendedora() {
  await encerrarSessaoRevendedora();
  redirect("/revendedora");
}

export async function salvarPerfil(_estado: string, formData: FormData): Promise<string> {
  const r = await revendedoraLogada();
  if (!r) return "Sessão expirada. Entre novamente.";
  const nome = String(formData.get("nome") ?? "").trim().slice(0, 60);
  const margem = lerMargem(formData.get("margem"));
  if (nome.length < 3) return "Informe seu nome.";
  if (margem === null) return `A margem precisa ser entre 0% e ${MARGEM_MAXIMA}%.`;
  await salvarRevendedora({ ...r, nome, margem });
  refresh();
  return "Salvo!";
}

async function pedidoDaRevendedora(id: string) {
  const r = await revendedoraLogada();
  const pedido = r ? await buscarPedido(id) : null;
  if (!r || !pedido || pedido.revendedora?.usuario !== r.usuario) throw new Error("Não autorizado");
  return pedido;
}

export async function substituirRevendedora(
  id: string,
  origem: string,
  produtoId: string,
  cor: string,
  tamanho: string,
  quantidade: number,
) {
  const pedido = await pedidoDaRevendedora(id);
  await substituirItem(pedido, origem, produtoId, cor, tamanho, quantidade, "revendedora");
  refresh();
}

export async function removerSubstituicaoRevendedora(id: string, subId: string) {
  const pedido = await pedidoDaRevendedora(id);
  // Depois que a loja conferiu a substituição, só a loja pode desfazer
  if (pedido.conferencia?.[`sub:${subId}`]) throw new Error("Substituição já conferida pela loja.");
  await removerSubstituicao(id, subId);
  refresh();
}
