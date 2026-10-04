"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Grade, Itens } from "@/lib/calculo";

type Carrinho = {
  itens: Itens;
  carregado: boolean;
  cupom: string;
  observacao: string;
  definirGrade: (produtoId: string, grade: Grade) => void;
  remover: (produtoId: string) => void;
  limpar: () => void;
  setCupom: (codigo: string) => void;
  setObservacao: (texto: string) => void;
};

const CarrinhoContext = createContext<Carrinho | null>(null);
const CHAVE = "marderosas-carrinho";

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<Itens>({});
  const [cupom, setCupom] = useState("");
  const [observacao, setObservacao] = useState("");
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restaura o carrinho salvo no navegador
      setItens(salvo.itens ?? {});
      setCupom(salvo.cupom ?? "");
      setObservacao(salvo.observacao ?? "");
    } catch {}
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ itens, cupom, observacao }));
    } catch {}
  }, [itens, cupom, observacao, carregado]);

  const definirGrade = useCallback((produtoId: string, grade: Grade) => {
    setItens((atual) => {
      const limpa = Object.fromEntries(Object.entries(grade).filter(([, q]) => q > 0));
      const novo = { ...atual };
      if (Object.keys(limpa).length === 0) delete novo[produtoId];
      else novo[produtoId] = limpa;
      return novo;
    });
  }, []);

  const remover = useCallback((produtoId: string) => {
    setItens((atual) => {
      const novo = { ...atual };
      delete novo[produtoId];
      return novo;
    });
  }, []);

  const limpar = useCallback(() => {
    setItens({});
    setCupom("");
    setObservacao("");
  }, []);

  const valor = useMemo(
    () => ({ itens, carregado, cupom, observacao, definirGrade, remover, limpar, setCupom, setObservacao }),
    [itens, carregado, cupom, observacao, definirGrade, remover, limpar],
  );

  return <CarrinhoContext.Provider value={valor}>{children}</CarrinhoContext.Provider>;
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error("useCarrinho precisa estar dentro de CarrinhoProvider");
  return ctx;
}
