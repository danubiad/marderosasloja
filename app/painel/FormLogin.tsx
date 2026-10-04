"use client";

import { useActionState } from "react";
import { entrar } from "./actions";

export function FormLogin() {
  const [erro, acao, enviando] = useActionState(entrar, "");

  return (
    <form action={acao} className="mx-auto mt-16 grid w-full max-w-sm gap-4 px-4">
      <h1 className="text-center font-serif text-3xl font-semibold">Painel de pedidos</h1>
      <input
        type="password"
        name="senha"
        placeholder="Senha"
        autoComplete="current-password"
        required
        autoFocus
        className="w-full rounded-md border border-linha px-4 py-3.5 text-lg outline-none focus:border-dourado"
      />
      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-texto px-4 py-3.5 text-lg font-bold text-white disabled:opacity-50"
      >
        {enviando ? "Entrando..." : "Entrar"}
      </button>
      {erro && (
        <p role="alert" className="text-center text-promo">
          {erro}
        </p>
      )}
    </form>
  );
}
