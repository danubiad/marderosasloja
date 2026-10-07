"use client";

import { useActionState } from "react";
import { conectarMetaAds } from "../actions";

export function FormConectarMeta() {
  const [aviso, acao, enviando] = useActionState(conectarMetaAds, "");

  return (
    <form action={acao} className="mt-3 flex flex-wrap gap-2">
      <input
        type="password"
        name="token"
        placeholder="Cole aqui o token do usuário do sistema"
        autoComplete="off"
        required
        className="min-w-0 flex-1 rounded-md border border-linha bg-white px-3 py-2 text-sm outline-none focus:border-dourado"
      />
      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-texto px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {enviando ? "Conectando..." : "Conectar"}
      </button>
      {aviso && (
        <p role="alert" className="w-full text-sm text-promo">
          {aviso}
        </p>
      )}
    </form>
  );
}
