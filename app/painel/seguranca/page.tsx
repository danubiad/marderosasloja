import type { Metadata } from "next";
import QRCode from "qrcode";
import { loja } from "@/lib/config";
import { emailConfigurado } from "@/lib/email";
import { kv } from "@/lib/kv";
import { authenticatorLigado, buscarConta } from "@/lib/painel";
import { enderecoAuthenticator } from "@/lib/totp";
import { AbasPainel } from "../AbasPainel";
import { bloqueioPainel } from "../acesso";
import { iniciarAuthenticator, sairDosOutros } from "./actions";
import { FormConfirmarAuthenticator, FormDesligarAuthenticator, FormEmail, FormTrocarSenha } from "./Formularios";

export const metadata: Metadata = {
  title: `Segurança — Painel ${loja.vendedora}`,
  robots: { index: false, follow: false },
};

const caixa = "rounded-lg border border-linha p-4";

export default async function Seguranca() {
  const bloqueio = await bloqueioPainel();
  if (bloqueio) return bloqueio;

  const conta = await buscarConta();
  const ligado = authenticatorLigado(conta);
  const pendente = ligado ? null : await kv.get<string>("painel:totp-pendente");
  const qr = pendente ? await QRCode.toDataURL(enderecoAuthenticator(pendente, loja.vendedora, "painel"), { margin: 1, width: 240 }) : null;

  return (
    <>
      <AbasPainel atual="/painel/seguranca" />
      <main className="mx-auto grid w-full max-w-2xl gap-4 px-4 pb-16 pt-5">
        <section className={caixa}>
          <h2 className="text-lg font-bold">Google Authenticator</h2>
          {ligado ? (
            <>
              <p className="mt-1 text-sm">
                <span className="font-semibold text-sucesso">✓ Ligado.</span> Para entrar no painel: senha + o código de 6 números do aplicativo.
              </p>
              <FormDesligarAuthenticator />
            </>
          ) : conta?.totp ? (
            <p className="mt-1 text-sm text-promo">Desligado na Vercel (PAINEL_SEM_AUTHENTICATOR). Tire essa variável para ligar de novo.</p>
          ) : qr && pendente ? (
            <div className="mt-2 grid gap-3 text-sm">
              <p>
                1. No celular, abra o <strong>Google Authenticator</strong>, toque em <strong>+</strong> e em <strong>Ler código QR</strong>.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR code do Google Authenticator" width={240} height={240} className="rounded border border-linha" />
              <p className="text-xs text-suave">
                Se não der para ler: toque em &quot;Inserir chave de configuração&quot; e digite <code className="break-all font-semibold">{pendente}</code>
              </p>
              <p>2. Digite abaixo o código de 6 números que apareceu no aplicativo.</p>
              <FormConfirmarAuthenticator />
            </div>
          ) : (
            <div className="mt-1 grid gap-3 text-sm">
              <p>Desligado. Com ele ligado, quem descobrir a sua senha ainda não entra: precisa do código que só aparece no seu celular.</p>
              <form action={iniciarAuthenticator}>
                <button type="submit" className="rounded-md bg-dourado-escuro px-4 py-2.5 font-semibold text-white">
                  Ligar o Google Authenticator
                </button>
              </form>
            </div>
          )}
        </section>

        <section className={caixa}>
          <h2 className="text-lg font-bold">E-mail para &quot;Esqueci minha senha&quot;</h2>
          <p className="mt-1 text-sm text-suave">
            O link de senha nova vai para este e-mail.{" "}
            {emailConfigurado() ? (
              <span className="text-sucesso">O envio de e-mail está ligado.</span>
            ) : (
              <span className="text-promo">Falta a chave do Resend (RESEND_API_KEY) na Vercel: sem ela o e-mail não sai.</span>
            )}
          </p>
          <FormEmail email={conta?.email ?? ""} />
        </section>

        <section className={caixa}>
          <h2 className="text-lg font-bold">Trocar a senha</h2>
          <FormTrocarSenha />
        </section>

        <section className={caixa}>
          <h2 className="text-lg font-bold">Aparelhos</h2>
          <p className="mt-1 text-sm text-suave">
            &quot;Sair&quot;, lá em cima, desconecta só este aparelho. Se você entrou no painel num aparelho que não é seu, ou acha que alguém entrou,
            use o botão abaixo: todos os outros aparelhos saem na hora.
          </p>
          <form action={sairDosOutros} className="mt-3">
            <button type="submit" className="rounded-md border border-promo px-4 py-2.5 font-semibold text-promo">
              Sair de todos os outros aparelhos
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
