"use client";

import { useState } from "react";
import { IconeCompartilhar } from "@/components/icones";

// Botão do painel para encaminhar um pedido ou carrinho para a cliente (ou para quem quiser).
// No celular abre o menu de compartilhar (WhatsApp, Instagram...); no computador copia o texto.
export function BotaoCompartilhar({ titulo, texto }: { titulo: string; texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return; // cancelou o menu
      }
    }
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // sem permissão para copiar: não há o que fazer
    }
  }

  return (
    <button
      type="button"
      onClick={compartilhar}
      className="flex items-center gap-2 rounded-md border border-linha px-3 py-2 text-sm font-semibold"
    >
      <IconeCompartilhar className="size-4" /> {copiado ? "Copiado! É só colar" : "Compartilhar"}
    </button>
  );
}
