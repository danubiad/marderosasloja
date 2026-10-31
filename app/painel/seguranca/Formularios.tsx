"use client";

import { useActionState, useState } from "react";
import { confirmarAuthenticator, desligarAuthenticator, emailDeTeste, salvarEmailPainel, trocarSenhaPainel } from "./actions";

const campo = "w-full rounded-md border border-linha px-3 py-2.5 text-base outline-none focus:border-dourado";
const botao = "rounded-md bg-texto px-4 py-2.5 font-semibold text-white disabled:opacity-50";

function CampoCodigo() {
  return (
    <input
      name="codigo"
      placeholder="Código de 6 números"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9 ]{6,7}"
      maxLength={7}
      required
      className={campo}
    />
  );
}

export function FormConfirmarAuthenticator() {
  const [erro, acao, enviando] = useActionState(confirmarAuthenticator, "");
  return (
    <form action={acao} className="grid max-w-xs gap-2">
      <CampoCodigo />
      {erro && <p className="text-promo">{erro}</p>}
      <button type="submit" disabled={enviando} className={botao}>
        {enviando ? "Conferindo..." : "Confirmar e ligar"}
      </button>
    </form>
  );
}

export function FormDesligarAuthenticator() {
  const [erro, acao, enviando] = useActionState(desligarAuthenticator, "");
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-suave underline">Desligar (não recomendado)</summary>
      <form action={acao} className="mt-2 grid max-w-xs gap-2">
        <input name="senha" type="password" placeholder="Sua senha" autoComplete="current-password" required className={campo} />
        <CampoCodigo />
        {erro && <p className="text-promo">{erro}</p>}
        <button type="submit" disabled={enviando} className="rounded-md border border-promo px-4 py-2.5 font-semibold text-promo disabled:opacity-50">
          Desligar o Authenticator
        </button>
      </form>
    </details>
  );
}

export function FormEmail({ email }: { email: string }) {
  const [msg, acao, enviando] = useActionState(salvarEmailPainel, "");
  const [teste, setTeste] = useState("");
  const [testando, setTestando] = useState(false);
  return (
    <div className="mt-3 grid gap-2 text-sm">
      <form action={acao} className="flex flex-wrap gap-2">
        <input name="email" type="email" defaultValue={email} placeholder="seuemail@gmail.com" required className={`${campo} max-w-xs`} />
        <button type="submit" disabled={enviando} className={botao}>
          Salvar
        </button>
      </form>
      {msg && <p className={msg === "Salvo!" ? "text-sucesso" : "text-promo"}>{msg}</p>}
      {email && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={testando}
            onClick={async () => {
              setTestando(true);
              setTeste(await emailDeTeste());
              setTestando(false);
            }}
            className="rounded-md border border-linha px-3 py-2 font-semibold disabled:opacity-50"
          >
            {testando ? "Mandando..." : "Mandar e-mail de teste"}
          </button>
          {teste && <span>{teste}</span>}
        </div>
      )}
    </div>
  );
}

export function FormTrocarSenha() {
  const [msg, acao, enviando] = useActionState(trocarSenhaPainel, "");
  if (msg === "ok") return <p className="mt-2 text-sm text-sucesso">Senha trocada! Os outros aparelhos saíram do painel.</p>;
  return (
    <form action={acao} className="mt-2 grid max-w-xs gap-2 text-sm">
      <input name="atual" type="password" placeholder="Senha atual" autoComplete="current-password" required className={campo} />
      <input name="senha" type="password" placeholder="Senha nova (mín. 10 caracteres)" autoComplete="new-password" minLength={10} required className={campo} />
      <input name="confirmar" type="password" placeholder="Repita a senha nova" autoComplete="new-password" minLength={10} required className={campo} />
      {msg && <p className="text-promo">{msg}</p>}
      <button type="submit" disabled={enviando} className={botao}>
        {enviando ? "Salvando..." : "Trocar a senha"}
      </button>
    </form>
  );
}
