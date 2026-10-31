"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { substituirItem } from "@/lib/conferencia";
import { loja } from "@/lib/config";
import { somenteDigitos } from "@/lib/format";
import { kv } from "@/lib/kv";
import { dentroDoLimite } from "@/lib/limite";
import { MARGEM_MAXIMA } from "@/lib/margem";
import { buscarPedido, removerSubstituicao } from "@/lib/pedidos";
import {
  buscarRevendedora,
  encerrarSessaoRevendedora,
  iniciarSessaoRevendedora,
  revendedoraLogada,
  salvarImagemFoto,
  salvarRevendedora,
  SENHA_MINIMA,
  usarLinkSenha,
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
  if (senha.length < SENHA_MINIMA) return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  if (margem === null) return `A margem precisa ser entre 0% e ${MARGEM_MAXIMA}%.`;
  if (!(await dentroDoLimite("cadastroRevendedora"))) return "Muitos cadastros seguidos. Aguarde uma hora e tente de novo.";
  if (await buscarRevendedora(usuario)) return "Esse endereço de catálogo já está em uso. Escolha outro.";
  if (await kv.get(`revendedora-whatsapp:${whatsapp}`)) return "Já existe um cadastro com esse WhatsApp. Use a opção Entrar.";

  await salvarRevendedora({
    usuario,
    nome,
    whatsapp,
    margem,
    senhaHash: await gerarHashSenha(senha),
    status: "ativa",
    criadoEm: new Date().toISOString(),
  });
  await kv.set(`revendedora-whatsapp:${whatsapp}`, usuario);
  await iniciarSessaoRevendedora({ usuario });
  redirect("/revendedora/painel");
}

export async function entrar(_estado: string, formData: FormData): Promise<string> {
  if (!(await dentroDoLimite("loginRevendedora"))) return "Muitas tentativas. Aguarde 15 minutos e tente de novo.";
  const whatsapp = somenteDigitos(String(formData.get("whatsapp") ?? ""));
  const senha = String(formData.get("senha") ?? "");
  const usuario = await kv.get<string>(`revendedora-whatsapp:${whatsapp}`);
  const r = usuario ? await buscarRevendedora(usuario) : null;
  if (!r || !(await conferirSenha(senha, r.senhaHash))) {
    await esperar(1200);
    return "WhatsApp ou senha incorretos.";
  }
  if (r.status === "bloqueada") return `Seu cadastro está bloqueado. Fale com a ${loja.vendedora}.`;
  await iniciarSessaoRevendedora(r);
  redirect("/revendedora/painel");
}

export async function sairRevendedora() {
  await encerrarSessaoRevendedora();
  redirect("/revendedora");
}

/** "Esqueci minha senha": avisa a loja, que manda o link de nova senha pelo WhatsApp. */
export async function pedirNovaSenha(_estado: string, formData: FormData): Promise<string> {
  const whatsapp = somenteDigitos(String(formData.get("whatsapp") ?? ""));
  if (whatsapp.length < 10) return "Informe seu WhatsApp com DDD.";
  if (!(await dentroDoLimite("senhaRevendedora"))) return "Muitos pedidos seguidos. Aguarde uma hora e tente de novo.";
  const usuario = await kv.get<string>(`revendedora-whatsapp:${whatsapp}`);
  const r = usuario ? await buscarRevendedora(usuario) : null;
  if (r && r.status !== "bloqueada") await salvarRevendedora({ ...r, pedidoSenha: new Date().toISOString() });
  // Mesma resposta com ou sem cadastro: assim ninguém descobre quais números são de revendedoras
  return "ok";
}

/** Nova senha pelo link que a loja mandou: troca a senha, desconecta os outros aparelhos e já entra. */
export async function definirNovaSenha(_estado: string, formData: FormData): Promise<string> {
  const codigo = String(formData.get("codigo") ?? "");
  const senha = String(formData.get("senha") ?? "");
  if (senha.length < SENHA_MINIMA) return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  if (senha !== String(formData.get("confirmar") ?? "")) return "As duas senhas não estão iguais.";
  if (!(await dentroDoLimite("senhaRevendedora"))) return "Muitas tentativas. Aguarde uma hora e tente de novo.";
  const usuario = await usarLinkSenha(codigo);
  const r = usuario ? await buscarRevendedora(usuario) : null;
  if (!r) return `Este link venceu ou já foi usado. Peça outro à ${loja.vendedora}.`;
  if (r.status === "bloqueada") return `Seu cadastro está bloqueado. Fale com a ${loja.vendedora}.`;
  const nova = { ...r, senhaHash: await gerarHashSenha(senha), sessao: (r.sessao ?? 0) + 1, pedidoSenha: undefined };
  await salvarRevendedora(nova);
  await iniciarSessaoRevendedora(nova);
  redirect("/revendedora/painel");
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

/** Foto ou logo da revendedora, que aparece no catálogo dela no lugar da marca da loja. */
export async function salvarFoto(formData: FormData): Promise<string> {
  const r = await revendedoraLogada();
  if (!r) return "Sessão expirada. Entre novamente.";
  const arquivo = formData.get("foto");
  const tipo = formData.get("tipo") === "logo" ? "logo" : "foto";
  if (!(arquivo instanceof File) || arquivo.size === 0) return "Escolha uma imagem.";
  if (arquivo.size > 900_000) return "Imagem muito grande. Tente outra.";

  let jpg: Buffer;
  try {
    const imagem = sharp(Buffer.from(await arquivo.arrayBuffer())).rotate().flatten({ background: "#ffffff" });
    jpg = await (tipo === "foto"
      ? imagem.resize({ width: 400, height: 400, fit: "cover" })
      : imagem.resize({ width: 600, height: 600, fit: "inside", withoutEnlargement: true })
    )
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return "Não consegui abrir essa imagem. Tente outra (JPG ou PNG).";
  }

  await salvarImagemFoto(r.usuario, jpg.toString("base64"));
  await salvarRevendedora({ ...r, foto: { versao: Date.now(), tipo } });
  refresh();
  return "Salvo!";
}

export async function removerFoto() {
  const r = await revendedoraLogada();
  if (!r) return;
  await salvarImagemFoto(r.usuario, null);
  await salvarRevendedora({ ...r, foto: undefined });
  refresh();
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
