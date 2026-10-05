"use client";

import { useActionState, useState } from "react";
import { formatarTelefone } from "@/lib/format";
import { precoComMargem } from "@/lib/margem";
import { formatarPreco } from "@/lib/format";
import { cadastrar, entrar } from "./actions";

const campo = "w-full rounded-md border border-linha px-4 py-3 text-lg outline-none focus:border-dourado";

export function FormsAcesso() {
  const [aba, setAba] = useState<"entrar" | "cadastro">("cadastro");

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
      <h1 className="text-center font-serif text-3xl font-semibold">Seja revendedora Mar de Rosas</h1>
      <p className="mt-2 text-center text-suave">
        Tenha seu próprio catálogo com o seu preço, divulgue para suas clientes e receba os pedidos no seu WhatsApp.
      </p>

      <div className="mt-6 grid grid-cols-2 rounded-lg bg-fundo p-1">
        {(["cadastro", "entrar"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAba(a)}
            className={`rounded-md py-2 font-semibold ${aba === a ? "bg-white shadow-sm" : "text-suave"}`}
          >
            {a === "cadastro" ? "Criar cadastro" : "Entrar"}
          </button>
        ))}
      </div>

      {aba === "cadastro" ? <Cadastro /> : <Entrar />}
    </div>
  );
}

function Telefone({ name }: { name: string }) {
  const [valor, setValor] = useState("");
  return (
    <input
      name={name}
      value={valor}
      onChange={(e) => setValor(formatarTelefone(e.target.value))}
      placeholder="Seu WhatsApp com DDD"
      inputMode="tel"
      autoComplete="tel"
      required
      className={campo}
    />
  );
}

function Cadastro() {
  const [erro, acao, enviando] = useActionState(cadastrar, "");
  const [usuario, setUsuario] = useState("");
  const [margem, setMargem] = useState("60");
  const exemplo = precoComMargem(45, Number(margem.replace(",", ".")) || 0);

  return (
    <form action={acao} className="mt-5 grid gap-3">
      <input name="nome" placeholder="Seu nome" autoComplete="name" required className={campo} />
      <Telefone name="whatsapp" />
      <label className="grid gap-1 text-sm text-suave">
        Endereço do seu catálogo
        <div className="flex items-center rounded-md border border-linha focus-within:border-dourado">
          <span className="pl-3 text-base text-suave">…/r/</span>
          <input
            name="usuario"
            value={usuario}
            onChange={(e) =>
              setUsuario(
                e.target.value
                  .normalize("NFD")
                  .replace(/[̀-ͯ]/g, "")
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "-")
                  .slice(0, 30),
              )
            }
            placeholder="seunome"
            required
            className="w-full bg-transparent px-1 py-3 text-lg text-texto outline-none"
          />
        </div>
      </label>
      <label className="grid gap-1 text-sm text-suave">
        Sua margem sobre o preço de atacado (%)
        <input
          name="margem"
          value={margem}
          onChange={(e) => setMargem(e.target.value)}
          inputMode="decimal"
          required
          className={campo}
        />
        <span>
          Exemplo: peça de {formatarPreco(45)} no atacado sai por <strong className="text-texto">{formatarPreco(exemplo)}</strong> no seu
          catálogo.
        </span>
      </label>
      <input name="senha" type="password" placeholder="Crie uma senha (mín. 6 caracteres)" autoComplete="new-password" required className={campo} />
      {erro && <p className="text-center text-promo">{erro}</p>}
      <button type="submit" disabled={enviando} className="rounded-md bg-dourado-escuro py-3.5 text-lg font-bold text-white disabled:opacity-50">
        {enviando ? "Criando..." : "Criar meu catálogo"}
      </button>
      <p className="text-center text-xs text-suave">Seu catálogo fica no ar assim que a Mar de Rosas aprovar o cadastro.</p>
    </form>
  );
}

function Entrar() {
  const [erro, acao, enviando] = useActionState(entrar, "");
  return (
    <form action={acao} className="mt-5 grid gap-3">
      <Telefone name="whatsapp" />
      <input name="senha" type="password" placeholder="Senha" autoComplete="current-password" required className={campo} />
      {erro && <p className="text-center text-promo">{erro}</p>}
      <button type="submit" disabled={enviando} className="rounded-md bg-texto py-3.5 text-lg font-bold text-white disabled:opacity-50">
        {enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
