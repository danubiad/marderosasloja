"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Grade, Itens } from "@/lib/calculo";
import { formatarTelefone, somenteDigitos } from "@/lib/format";

type Identidade = { nome: string; telefone: string };

type Carrinho = {
  itens: Itens;
  carregado: boolean;
  cupom: string;
  observacao: string;
  identidade: Identidade | null;
  definirGrade: (produtoId: string, grade: Grade) => void;
  remover: (produtoId: string) => void;
  limpar: () => void;
  setCupom: (codigo: string) => void;
  setObservacao: (texto: string) => void;
};

const CarrinhoContext = createContext<Carrinho | null>(null);
/** Nome e WhatsApp da cliente (o checkout também usa e completa esses dados) */
export const CHAVE_CLIENTE = "marderosas-cliente";

function lerIdentidade(): Identidade | null {
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE_CLIENTE) ?? "null");
    if (d?.nome && somenteDigitos(d.telefone ?? "").length >= 10) return { nome: d.nome, telefone: d.telefone };
  } catch {}
  return null;
}

type Props = {
  children: React.ReactNode;
  /** Usuário da revendedora: o carrinho do catálogo dela fica separado do da loja */
  revendedora?: string;
};

export function CarrinhoProvider({ children, revendedora }: Props) {
  const chave = revendedora ? `marderosas-carrinho:r:${revendedora}` : "marderosas-carrinho";
  const [itens, setItens] = useState<Itens>({});
  const [cupom, setCupom] = useState("");
  const [observacao, setObservacao] = useState("");
  const [carregado, setCarregado] = useState(false);
  const [identidade, setIdentidade] = useState<Identidade | null>(null);
  const [pendente, setPendente] = useState<{ produtoId: string; grade: Grade } | null>(null);
  const itensRef = useRef(itens);
  useEffect(() => {
    itensRef.current = itens;
  }, [itens]);

  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(chave) ?? "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restaura o carrinho salvo no navegador
      setItens(salvo.itens ?? {});
      setCupom(salvo.cupom ?? "");
      setObservacao(salvo.observacao ?? "");
    } catch {}
    setIdentidade(lerIdentidade());
    setCarregado(true);
  }, [chave]);

  useEffect(() => {
    if (!carregado) return;
    try {
      localStorage.setItem(chave, JSON.stringify({ itens, cupom, observacao }));
    } catch {}
  }, [chave, itens, cupom, observacao, carregado]);

  // Envia o carrinho para o servidor (para a loja ver carrinhos e clientes no painel)
  const sincronizar = useCallback(() => {
    if (!identidade) return;
    fetch("/api/carrinho", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...identidade, itens: itensRef.current, revendedora }),
      keepalive: true,
    }).catch(() => {});
  }, [identidade, revendedora]);

  useEffect(() => {
    if (!carregado || !identidade) return;
    const t = setTimeout(sincronizar, 1200);
    return () => clearTimeout(t);
  }, [itens, carregado, identidade, sincronizar]);

  // Sinal de "navegando agora" a cada minuto enquanto a página está aberta
  useEffect(() => {
    if (!identidade) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") sincronizar();
    }, 60000);
    return () => clearInterval(id);
  }, [identidade, sincronizar]);

  const aplicarGrade = useCallback((produtoId: string, grade: Grade) => {
    setItens((atual) => {
      const limpa = Object.fromEntries(Object.entries(grade).filter(([, q]) => q > 0));
      const novo = { ...atual };
      if (Object.keys(limpa).length === 0) delete novo[produtoId];
      else novo[produtoId] = limpa;
      return novo;
    });
  }, []);

  const definirGrade = useCallback(
    (produtoId: string, grade: Grade) => {
      const adicionando = Object.values(grade).some((q) => q > 0);
      // Na primeira peça, pede nome e WhatsApp para salvar o carrinho
      if (adicionando && !identidade) {
        setPendente({ produtoId, grade });
        return;
      }
      aplicarGrade(produtoId, grade);
    },
    [identidade, aplicarGrade],
  );

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

  function confirmarIdentidade(dados: Identidade) {
    try {
      const atual = JSON.parse(localStorage.getItem(CHAVE_CLIENTE) ?? "{}");
      localStorage.setItem(CHAVE_CLIENTE, JSON.stringify({ ...atual, ...dados }));
    } catch {}
    setIdentidade(dados);
    if (pendente) aplicarGrade(pendente.produtoId, pendente.grade);
    setPendente(null);
  }

  const valor = useMemo(
    () => ({ itens, carregado, cupom, observacao, identidade, definirGrade, remover, limpar, setCupom, setObservacao }),
    [itens, carregado, cupom, observacao, identidade, definirGrade, remover, limpar],
  );

  return (
    <CarrinhoContext.Provider value={valor}>
      {children}
      {pendente && <ModalIdentificacao onConfirmar={confirmarIdentidade} onCancelar={() => setPendente(null)} />}
    </CarrinhoContext.Provider>
  );
}

function ModalIdentificacao({ onConfirmar, onCancelar }: { onConfirmar: (d: Identidade) => void; onCancelar: () => void }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (nome.trim().length < 2) return setErro("Informe seu nome.");
    if (somenteDigitos(telefone).length < 10) return setErro("Informe seu WhatsApp com DDD.");
    onConfirmar({ nome: nome.trim(), telefone });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onCancelar} aria-label="Fechar" />
      <form
        onSubmit={enviar}
        className="relative w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
      >
        <h2 className="text-xl font-bold">Vamos salvar seu carrinho</h2>
        <p className="mt-1 text-sm text-suave">
          Informe seu nome e WhatsApp para guardar suas peças. Se precisar, uma vendedora te ajuda a finalizar.
        </p>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          autoComplete="name"
          autoFocus
          className="mt-4 w-full rounded-md border border-linha px-4 py-3 text-lg outline-none focus:border-dourado"
        />
        <input
          value={telefone}
          onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
          placeholder="WhatsApp com DDD"
          inputMode="tel"
          autoComplete="tel"
          className="mt-3 w-full rounded-md border border-linha px-4 py-3 text-lg outline-none focus:border-dourado"
        />
        {erro && <p className="mt-2 text-sm text-promo">{erro}</p>}
        <button type="submit" className="mt-4 w-full rounded-md bg-sucesso py-3.5 text-lg font-bold text-white">
          Continuar
        </button>
      </form>
    </div>
  );
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error("useCarrinho precisa estar dentro de CarrinhoProvider");
  return ctx;
}
