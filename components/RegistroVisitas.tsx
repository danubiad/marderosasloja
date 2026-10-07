"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { origemDaVisita, registrarEvento } from "@/lib/rastreio";

const CHAVE = "mr-sessao";

/** Conta uma sessão por aba do navegador, com a origem (UTM), só no catálogo da loja. */
export function RegistroVisitas() {
  const catalogoDaLoja = !/^\/(painel|revendedora|r)(\/|$)/.test(usePathname());

  useEffect(() => {
    if (!catalogoDaLoja) return;
    try {
      if (sessionStorage.getItem(CHAVE)) return;
      sessionStorage.setItem(CHAVE, "1");
    } catch {}
    registrarEvento("sessao", origemDaVisita());
  }, [catalogoDaLoja]);

  return null;
}
