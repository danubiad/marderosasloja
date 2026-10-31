import "server-only";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { kv } from "@/lib/kv";
import { assinar, conferirSenha, gerarHashSenha, iguais, verificar } from "@/lib/sessao";
import { verificarCodigo } from "@/lib/totp";

// Conta do painel da loja, no banco (desde 30/10/2026): senha (só o hash), Google Authenticator,
// e-mail de recuperação e versão da sessão. Enquanto a conta não existe, vale a senha da variável
// PAINEL_SENHA (Vercel); no primeiro login ela é copiada para o banco e depois muda pela aba Segurança.
// Emergência (perdeu o celular do Authenticator): PAINEL_SEM_AUTHENTICATOR=1 na Vercel desliga o código.

export type ContaPainel = {
  senhaHash: string;
  /** Sobe ao trocar a senha ou em "Sair dos outros aparelhos": os cookies antigos param de valer */
  sessao: number;
  /** Segredo do Google Authenticator, quando ligado */
  totp?: string;
  /** Último intervalo de 30 s usado: o mesmo código não entra duas vezes */
  totpUltimo?: number;
  /** Para onde vai o link de "Esqueci minha senha" */
  email?: string;
};

const CHAVE_CONTA = "painel:conta";
export const COOKIE_PAINEL = "painel";
export const DURACAO_SESSAO = 60 * 60 * 24 * 30; // 30 dias
export const SENHA_MINIMA_PAINEL = 10;

export const buscarConta = () => kv.get<ContaPainel>(CHAVE_CONTA);
export const salvarConta = (c: ContaPainel) => kv.set(CHAVE_CONTA, c);

export async function painelConfigurado() {
  await connection(); // decide na hora do acesso, nunca na montagem do site
  return Boolean(process.env.PAINEL_SENHA) || Boolean(await buscarConta());
}

export function authenticatorLigado(c: ContaPainel | null): c is ContaPainel & { totp: string } {
  return Boolean(c?.totp) && process.env.PAINEL_SEM_AUTHENTICATOR !== "1";
}

/** Confere o código do Authenticator e marca o intervalo como usado. */
export async function usarCodigo(conta: ContaPainel & { totp: string }, codigo: string) {
  const passo = verificarCodigo(conta.totp, codigo, conta.totpUltimo);
  if (passo === null) return false;
  await salvarConta({ ...conta, totpUltimo: passo });
  return true;
}

/** Confere senha e, se ligado, o código. Devolve a conta ou a mensagem de erro. */
export async function conferirLogin(senha: string, codigo: string): Promise<{ conta: ContaPainel } | { erro: string }> {
  const conta = await buscarConta();
  if (!conta) {
    const inicial = process.env.PAINEL_SENHA ?? "";
    if (!inicial || !iguais(senha, inicial)) return { erro: "Senha incorreta." };
    const nova = { senhaHash: await gerarHashSenha(inicial), sessao: 1 };
    await salvarConta(nova);
    return { conta: nova };
  }
  if (!(await conferirSenha(senha, conta.senhaHash))) return { erro: "Senha incorreta." };
  if (authenticatorLigado(conta) && !(await usarCodigo(conta, codigo))) {
    return { erro: "Código do Google Authenticator incorreto. Use o código que está aparecendo agora." };
  }
  return { conta: (await buscarConta()) ?? conta };
}

// O cookie leva a versão da sessão e a validade, assinados (o "|" não aparece nos cookies das revendedoras)
export async function iniciarSessao(conta: ContaPainel) {
  const expira = Math.floor(Date.now() / 1000) + DURACAO_SESSAO;
  (await cookies()).set(COOKIE_PAINEL, assinar(`painel|${conta.sessao}|${expira}`), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/painel",
    maxAge: DURACAO_SESSAO,
  });
}

export async function encerrarSessao() {
  (await cookies()).delete({ name: COOKIE_PAINEL, path: "/painel" });
}

export async function estaLogado() {
  const valor = verificar((await cookies()).get(COOKIE_PAINEL)?.value);
  if (!valor) return false;
  const [tipo, sessao, expira] = valor.split("|");
  if (tipo !== "painel" || !(Number(expira) > Date.now() / 1000)) return false;
  const conta = await buscarConta();
  return Boolean(conta) && String(conta!.sessao) === sessao;
}

// Link de "Esqueci minha senha" (vai por e-mail): vale 30 minutos e uma vez só; no banco fica só o hash
const DURACAO_LINK = 30 * 60;
const chaveLink = (codigo: string) => `painel:senha-link:${createHash("sha256").update(codigo).digest("hex")}`;

export async function criarLinkSenhaPainel() {
  const codigo = randomBytes(24).toString("base64url");
  await kv.setExpira(chaveLink(codigo), 1, DURACAO_LINK);
  return codigo;
}

export async function linkSenhaPainelValido(codigo: string) {
  return Boolean(codigo) && Boolean(await kv.get(chaveLink(codigo)));
}

export function apagarLinkSenhaPainel(codigo: string) {
  return kv.del(chaveLink(codigo));
}
