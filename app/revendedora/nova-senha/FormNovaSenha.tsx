"use client";

import { useActionState } from "react";
import { definirNovaSenha } from "../actions";
import { campo } from "../FormsAcesso";

export function FormNovaSenha({ codigo }: { codigo: string }) {
  const [erro, acao, enviando] = useActionState(definirNovaSenha, "");
  return (
    <form action={acao} className="mt-6 grid gap-3">
      <input type="hidden" name="codigo" value={codigo} />
      <input name="senha" type="password" placeholder="Senha nova (mín. 8 caracteres)" autoComplete="new-password" minLength={8} required className={campo} />
      <input name="confirmar" type="password" placeholder="Repita a senha nova" autoComplete="new-password" minLength={8} required className={campo} />
      {erro && <p className="text-center text-promo">{erro}</p>}
      <button type="submit" disabled={enviando} className="rounded-md bg-dourado-escuro py-3.5 text-lg font-bold text-white disabled:opacity-50">
        {enviando ? "Salvando..." : "Salvar e entrar"}
      </button>
      <p className="text-center text-xs text-suave">Ao salvar, os outros aparelhos em que você estava logada saem da conta.</p>
    </form>
  );
}
