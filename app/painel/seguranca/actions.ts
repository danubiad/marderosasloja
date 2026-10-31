"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { loja } from "@/lib/config";
import { emailConfigurado, enviarEmail } from "@/lib/email";
import { kv } from "@/lib/kv";
import { dentroDoLimite } from "@/lib/limite";
import {
  apagarLinkSenhaPainel,
  authenticatorLigado,
  buscarConta,
  criarLinkSenhaPainel,
  estaLogado,
  iniciarSessao,
  linkSenhaPainelValido,
  salvarConta,
  SENHA_MINIMA_PAINEL,
  usarCodigo,
} from "@/lib/painel";
import { conferirSenha, gerarHashSenha } from "@/lib/sessao";
import { novoSegredo, verificarCodigo } from "@/lib/totp";

const CHAVE_PENDENTE = "painel:totp-pendente"; // segredo do QR code enquanto ela não confirma
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function contaLogada() {
  const conta = (await estaLogado()) ? await buscarConta() : null;
  if (!conta) throw new Error("Não autorizado");
  return conta;
}

function validarNova(senha: string, confirmar: string) {
  if (senha.length < SENHA_MINIMA_PAINEL) return `A senha nova precisa ter pelo menos ${SENHA_MINIMA_PAINEL} caracteres.`;
  if (senha !== confirmar) return "As duas senhas novas não estão iguais.";
  return "";
}

// ------------------------------------------------------------------ Google Authenticator

/** Gera o QR code (vale 15 minutos até ela confirmar com um código). */
export async function iniciarAuthenticator() {
  await contaLogada();
  await kv.setExpira(CHAVE_PENDENTE, novoSegredo(), 15 * 60);
  refresh();
}

export async function confirmarAuthenticator(_estado: string, formData: FormData): Promise<string> {
  const conta = await contaLogada();
  const segredo = await kv.get<string>(CHAVE_PENDENTE);
  if (!segredo) return "O QR code venceu. Toque em Ligar de novo.";
  const passo = verificarCodigo(segredo, String(formData.get("codigo") ?? ""));
  if (passo === null) return "Código incorreto. Confira se leu o QR code certo e use o código que está aparecendo agora.";
  await salvarConta({ ...conta, totp: segredo, totpUltimo: passo });
  await kv.del(CHAVE_PENDENTE);
  refresh();
  return "";
}

export async function desligarAuthenticator(_estado: string, formData: FormData): Promise<string> {
  const conta = await contaLogada();
  if (!(await conferirSenha(String(formData.get("senha") ?? ""), conta.senhaHash))) return "Senha incorreta.";
  if (authenticatorLigado(conta) && !(await usarCodigo(conta, String(formData.get("codigo") ?? "")))) return "Código incorreto.";
  await salvarConta({ ...((await buscarConta()) ?? conta), totp: undefined, totpUltimo: undefined });
  refresh();
  return "";
}

// ------------------------------------------------------------------ senha, aparelhos e e-mail

export async function trocarSenhaPainel(_estado: string, formData: FormData): Promise<string> {
  const conta = await contaLogada();
  if (!(await conferirSenha(String(formData.get("atual") ?? ""), conta.senhaHash))) return "A senha atual está incorreta.";
  const erro = validarNova(String(formData.get("senha") ?? ""), String(formData.get("confirmar") ?? ""));
  if (erro) return erro;
  const nova = { ...conta, senhaHash: await gerarHashSenha(String(formData.get("senha"))), sessao: conta.sessao + 1 };
  await salvarConta(nova);
  await iniciarSessao(nova); // este aparelho continua; os outros saem
  return "ok";
}

/** Desconecta todos os outros aparelhos (este continua logado). */
export async function sairDosOutros() {
  const conta = await contaLogada();
  const nova = { ...conta, sessao: conta.sessao + 1 };
  await salvarConta(nova);
  await iniciarSessao(nova);
  refresh();
}

export async function salvarEmailPainel(_estado: string, formData: FormData): Promise<string> {
  const conta = await contaLogada();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_VALIDO.test(email)) return "E-mail inválido.";
  await salvarConta({ ...conta, email });
  refresh();
  return "Salvo!";
}

export async function emailDeTeste(): Promise<string> {
  const conta = await contaLogada();
  if (!conta.email) return "Salve o e-mail primeiro.";
  if (!emailConfigurado()) return "Falta a chave do Resend (RESEND_API_KEY) na Vercel.";
  try {
    await enviarEmail(conta.email, `Teste do painel ${loja.vendedora}`, `<p>Funcionou! O link de "Esqueci minha senha" do painel ${loja.vendedora} vai chegar neste e-mail.</p>`);
    return "Mandei! Confira a caixa de entrada (e o spam).";
  } catch (e) {
    console.error(e);
    return "O Resend recusou o envio. Confira se a conta do Resend foi criada com este mesmo e-mail.";
  }
}

// ------------------------------------------------------------------ esqueci minha senha (sem estar logada)

export async function pedirLinkSenhaPainel(): Promise<string> {
  if (!(await dentroDoLimite("senhaPainel"))) return "Muitos pedidos seguidos. Aguarde uma hora e tente de novo.";
  const conta = await buscarConta();
  if (conta?.email && emailConfigurado()) {
    const link = `https://${loja.dominio}/painel/nova-senha?t=${await criarLinkSenhaPainel()}`;
    try {
      await enviarEmail(
        conta.email,
        `Senha nova do painel ${loja.vendedora}`,
        `<p>Alguém pediu uma senha nova para o painel da ${loja.vendedora}.</p>
<p><a href="${link}">Criar senha nova</a> (vale por 30 minutos e funciona uma vez só).</p>
<p>Se não foi você, ignore este e-mail: a senha atual continua valendo.</p>`,
      );
    } catch (e) {
      console.error(e);
    }
  }
  // A mesma resposta sempre: quem não é a dona não descobre nada
  return "ok";
}

export async function definirSenhaPainel(_estado: string, formData: FormData): Promise<string> {
  if (!(await dentroDoLimite("senhaPainel"))) return "Muitas tentativas. Aguarde uma hora e tente de novo.";
  const codigoLink = String(formData.get("link") ?? "");
  if (!(await linkSenhaPainelValido(codigoLink))) return "Este link venceu ou já foi usado. Peça outro em Esqueci minha senha.";
  const erro = validarNova(String(formData.get("senha") ?? ""), String(formData.get("confirmar") ?? ""));
  if (erro) return erro;
  const conta = await buscarConta();
  if (!conta) return "O painel ainda não tem conta.";
  if (authenticatorLigado(conta) && !(await usarCodigo(conta, String(formData.get("codigo") ?? "")))) {
    return "Código do Google Authenticator incorreto.";
  }
  const atual = (await buscarConta()) ?? conta;
  const nova = { ...atual, senhaHash: await gerarHashSenha(String(formData.get("senha"))), sessao: atual.sessao + 1 };
  await salvarConta(nova);
  await apagarLinkSenhaPainel(codigoLink);
  await iniciarSessao(nova);
  redirect("/painel");
}
