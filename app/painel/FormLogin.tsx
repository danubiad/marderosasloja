"use client";

import { useActionState, useState } from "react";
import { entrar } from "./actions";
import { pedirLinkSenhaPainel } from "./seguranca/actions";

const campo = "w-full rounded-md border border-linha px-4 py-3.5 text-lg outline-none focus:border-dourado";

export function FormLogin({ pedeCodigo }: { pedeCodigo: boolean }) {
  const [erro, acao, enviando] = useActionState(entrar, "");
  const [esqueci, setEsqueci] = useState(false);

  if (esqueci) return <EsqueciSenha voltar={() => setEsqueci(false)} />;
  return (
    <form action={acao} className="mx-auto mt-16 grid w-full max-w-sm gap-4 px-4">
      <h1 className="text-center font-serif text-3xl font-semibold">Painel de pedidos</h1>
      <input type="password" name="senha" placeholder="Senha" autoComplete="current-password" required autoFocus className={campo} />
      {pedeCodigo && (
        <input
          name="codigo"
          placeholder="Código do Google Authenticator"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          className={campo}
        />
      )}
      <button type="submit" disabled={enviando} className="rounded-md bg-texto px-4 py-3.5 text-lg font-bold text-white disabled:opacity-50">
        {enviando ? "Entrando..." : "Entrar"}
      </button>
      {erro && (
        <p role="alert" className="text-center text-promo">
          {erro}
        </p>
      )}
      <button type="button" onClick={() => setEsqueci(true)} className="text-center text-sm text-suave underline">
        Esqueci minha senha
      </button>
    </form>
  );
}

function EsqueciSenha({ voltar }: { voltar: () => void }) {
  const [resposta, acao, enviando] = useActionState(pedirLinkSenhaPainel, "");
  return (
    <form action={acao} className="mx-auto mt-16 grid w-full max-w-sm gap-4 px-4 text-center">
      <h1 className="font-serif text-3xl font-semibold">Esqueci minha senha</h1>
      {resposta === "ok" ? (
        <p className="rounded-md bg-creme px-4 py-3">
          Pronto! Se o e-mail de recuperação estiver cadastrado na aba Segurança, o link chega em alguns minutos. Veja também a caixa de
          spam. Ele vale por 30 minutos.
        </p>
      ) : (
        <>
          <p className="text-suave">Vamos mandar um link para o e-mail de recuperação do painel. Para criar a senha nova, ainda vai pedir o código do Google Authenticator.</p>
          {resposta && <p className="text-promo">{resposta}</p>}
          <button type="submit" disabled={enviando} className="rounded-md bg-texto px-4 py-3.5 text-lg font-bold text-white disabled:opacity-50">
            {enviando ? "Enviando..." : "Mandar link por e-mail"}
          </button>
        </>
      )}
      <button type="button" onClick={voltar} className="text-sm text-suave underline">
        Voltar
      </button>
    </form>
  );
}
