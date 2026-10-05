"use client";

import { useActionState, useState } from "react";
import { formatarPreco } from "@/lib/format";
import { precoComMargem } from "@/lib/margem";
import { salvarPerfil } from "../actions";

export function FormPerfil({ nome, margem }: { nome: string; margem: number }) {
  const [mensagem, acao, salvando] = useActionState(salvarPerfil, "");
  const [m, setM] = useState(String(margem));
  const exemplo = precoComMargem(45, Number(m.replace(",", ".")) || 0);

  return (
    <form action={acao} className="grid gap-3">
      <label className="grid gap-1 text-sm text-suave">
        Seu nome no catálogo
        <input name="nome" defaultValue={nome} required className="rounded-md border border-linha px-3 py-2.5 text-base text-texto" />
      </label>
      <label className="grid gap-1 text-sm text-suave">
        Sua margem sobre o atacado (%)
        <input
          name="margem"
          value={m}
          onChange={(e) => setM(e.target.value)}
          inputMode="decimal"
          className="rounded-md border border-linha px-3 py-2.5 text-base text-texto"
        />
        <span>
          Peça de {formatarPreco(45)} no atacado → <strong className="text-texto">{formatarPreco(exemplo)}</strong> para sua cliente.
        </span>
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={salvando} className="rounded-md bg-texto px-5 py-2.5 font-semibold text-white disabled:opacity-50">
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        {mensagem && <span className={mensagem === "Salvo!" ? "text-sucesso" : "text-promo"}>{mensagem}</span>}
      </div>
    </form>
  );
}
