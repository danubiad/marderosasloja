"use client";

import { useActionState } from "react";
import { definirSenhaPainel } from "../seguranca/actions";

const campo = "w-full rounded-md border border-linha px-4 py-3.5 text-lg outline-none focus:border-dourado";

export function FormSenhaNovaPainel({ link, pedeCodigo }: { link: string; pedeCodigo: boolean }) {
  const [erro, acao, enviando] = useActionState(definirSenhaPainel, "");
  return (
    <form action={acao} className="grid gap-3">
      <input type="hidden" name="link" value={link} />
      <input name="senha" type="password" placeholder="Senha nova (mín. 10 caracteres)" autoComplete="new-password" minLength={10} required className={campo} />
      <input name="confirmar" type="password" placeholder="Repita a senha nova" autoComplete="new-password" minLength={10} required className={campo} />
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
      {erro && <p className="text-center text-promo">{erro}</p>}
      <button type="submit" disabled={enviando} className="rounded-md bg-texto px-4 py-3.5 text-lg font-bold text-white disabled:opacity-50">
        {enviando ? "Salvando..." : "Salvar e entrar"}
      </button>
      <p className="text-center text-xs text-suave">Ao salvar, todos os outros aparelhos saem do painel.</p>
    </form>
  );
}
