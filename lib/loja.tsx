"use client";

import { createContext, useContext } from "react";

export type RevendedoraNoSite = {
  usuario: string;
  nome: string;
  whatsapp: string;
  margem: number;
  /** Foto ou logo da revendedora: no catálogo dela aparece no lugar da marca da loja */
  foto?: string;
  tipoFoto?: "foto" | "logo";
};

type Loja = {
  /** Prefixo dos links: "" na loja, "/r/<usuario>" no catálogo da revendedora */
  base: string;
  revendedora?: RevendedoraNoSite;
};

const LojaContext = createContext<Loja>({ base: "" });

export function LojaProvider({ revendedora, children }: { revendedora?: RevendedoraNoSite; children: React.ReactNode }) {
  return (
    <LojaContext.Provider value={{ base: revendedora ? `/r/${revendedora.usuario}` : "", revendedora }}>
      {children}
    </LojaContext.Provider>
  );
}

export function useLoja() {
  return useContext(LojaContext);
}
