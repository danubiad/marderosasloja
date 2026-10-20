"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { buscarProduto } from "@/data/produtos";
import { precosDoProduto } from "@/lib/disponibilidade";
import { alterarDisponibilidade, salvarCusto } from "@/lib/estoque";
import { COOKIE_PAINEL, DURACAO_SESSAO, estaLogado, senhaCorreta, tokenSessao } from "@/lib/painel";
import { substituirItem } from "@/lib/conferencia";
import { enviarCompraMeta } from "@/lib/meta-conversoes";
import { salvarMetaDiaria } from "@/lib/metas";
import { conectarMeta, desconectarMeta } from "@/lib/meta-ads";
import { diaSP } from "@/lib/datas";
import { dentroDoLimite } from "@/lib/limite";
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
  if (!(await dentroDoLimite("loginPainel"))) return "Muitas tentativas. Aguarde 15 minutos e tente de novo.";
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

/** Liga/desliga produto, cor, tamanho ou combinação cor + tamanho (aba Produtos). Vale na hora no catálogo. */
export type MudancaProduto =
  | { tipo: "ativo"; valor: boolean }
  | { tipo: "cor"; cor: string; valor: boolean }
  | { tipo: "tamanho"; tamanho: string; valor: boolean }
  | { tipo: "combinacao"; cor: string; tamanho: string; valor: boolean };

function alternar(lista: string[] | undefined, item: string, incluir: boolean) {
  const sem = (lista ?? []).filter((i) => i !== item);
  return incluir ? [...sem, item] : sem;
}

export async function mudarProduto(id: string, m: MudancaProduto) {
  await exigirLogin();
  const produto = buscarProduto(id);
  if (!produto) throw new Error("Produto não encontrado");
  if ("cor" in m && !produto.cores.some((c) => c.nome === m.cor)) throw new Error("Cor inválida");
  if ("tamanho" in m && !produto.tamanhos.includes(m.tamanho)) throw new Error("Tamanho inválido");
  // valor = ativo/disponível; as listas guardam o que está desligado
  await alterarDisponibilidade(id, (d) => {
    if (m.tipo === "ativo") d.inativo = !m.valor || undefined;
    if (m.tipo === "cor") d.coresInativas = alternar(d.coresInativas, m.cor, !m.valor);
    if (m.tipo === "tamanho") d.tamanhosInativos = alternar(d.tamanhosInativos, m.tamanho, !m.valor);
    if (m.tipo === "combinacao") d.esgotados = alternar(d.esgotados, `${m.cor}|${m.tamanho}`, !m.valor);
  });
  refresh();
}

/** Valor em reais digitado no painel ("1.234,50"): undefined = vazio, null = inválido. */
function lerValor(valor: string) {
  const texto = valor.replace(/[R$\s]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!texto) return undefined;
  const n = Number(texto);
  if (!Number.isFinite(n) || n < 0 || n > 100000) return null;
  return Math.round(n * 100) / 100;
}

/** Preço de custo do produto; vazio apaga. */
export async function mudarCusto(id: string, valor: string): Promise<string> {
  await exigirLogin();
  if (!buscarProduto(id)) return "Produto não encontrado.";
  const n = lerValor(valor);
  if (n === null) return "Valor inválido.";
  await salvarCusto(id, n ?? null);
  refresh();
  return "";
}

/** Preço de venda e promocional (promocional vazio = sem promoção). Vale na hora na loja, revendedoras e Instagram.
 *  Se ficar igual ao de data/catalogo.ts, volta a seguir o cadastro. */
export async function mudarPreco(id: string, venda: string, promocional: string): Promise<string> {
  await exigirLogin();
  const produto = buscarProduto(id);
  if (!produto) return "Produto não encontrado.";
  if (produto.precosTamanho) return "Este produto tem preço por tamanho.";
  const preco = lerValor(venda);
  const promo = lerValor(promocional);
  if (preco === undefined) return "Digite o preço de venda.";
  if (preco === null || promo === null) return "Valor inválido.";
  if (promo !== undefined && (promo <= 0 || promo >= preco)) return "A promoção tem que ser menor que o preço de venda.";
  const cadastro = precosDoProduto(produto);
  const igual = preco === cadastro.preco && promo === cadastro.precoPromocional;
  await alterarDisponibilidade(id, (d) => {
    d.preco = igual ? undefined : preco;
    d.precoPromocional = igual ? undefined : promo;
  });
  refresh();
  return "";
}
