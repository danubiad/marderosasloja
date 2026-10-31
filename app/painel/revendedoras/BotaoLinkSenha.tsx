"use client";

import { useState } from "react";
import { linkNovaSenhaRevendedora } from "../actions";

// Gera o link de nova senha e abre o WhatsApp da loja com a mensagem pronta para a revendedora.
export function BotaoLinkSenha({ usuario, destaque }: { usuario: string; destaque: boolean }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");

  async function mandar() {
    setErro("");
    setGerando(true);
    // A janela abre já no clique (senão o navegador bloqueia) e recebe o endereço quando o link fica pronto
    const janela = window.open("", "_blank");
    if (janela) janela.opener = null;
    try {
      const url = await linkNovaSenhaRevendedora(usuario);
      if (janela) janela.location.href = url;
      else window.location.href = url;
    } catch {
      janela?.close();
      setErro("Não deu certo. Tente de novo.");
    }
    setGerando(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={mandar}
        disabled={gerando}
        className={`rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-50 ${destaque ? "bg-dourado-escuro text-white" : "border border-linha"}`}
      >
        {gerando ? "Gerando..." : "Mandar link de senha nova"}
      </button>
      {erro && <span className="self-center text-sm text-promo">{erro}</span>}
    </>
  );
}
