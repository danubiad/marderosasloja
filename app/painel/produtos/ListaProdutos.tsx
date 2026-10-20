"use client";

import { useOptimistic, useState, useTransition } from "react";
import { BolinhaCor } from "@/components/BolinhaCor";
import { FotoProduto } from "@/components/FotoProduto";
import type { DisponibilidadeProduto } from "@/lib/disponibilidade";
import { formatarPreco } from "@/lib/format";
import { mudarCusto, mudarProduto, type MudancaProduto } from "../actions";

export type ProdutoPainel = {
  id: string;
  nome: string;
  referencia: string;
  foto?: string;
  preco: number;
  precoDe?: number;
  precosTamanho?: Record<string, number>;
  cores: { nome: string; hex: string; amostra?: string }[];
  tamanhos: string[];
  disponibilidade: DisponibilidadeProduto;
  custo?: number;
};

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function ListaProdutos({ produtos }: { produtos: ProdutoPainel[] }) {
  const [busca, setBusca] = useState("");
  const termo = semAcento(busca.trim());
  const filtrados = termo
    ? produtos.filter((p) => semAcento(`${p.nome} ${p.referencia}`).includes(termo))
    : produtos;
  const ativos = filtrados.filter((p) => !p.disponibilidade.inativo);
  const inativos = filtrados.filter((p) => p.disponibilidade.inativo);

  return (
    <div className="mt-4">
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar produto ou referência"
        className="w-full rounded-md border border-linha px-3 py-2.5"
      />

      <h2 className="mt-5 text-lg font-semibold">Ativos ({ativos.length})</h2>
      <ul className="mt-2 divide-y divide-linha rounded-lg border border-linha">
        {ativos.map((p) => (
          <LinhaProduto key={p.id} produto={p} />
        ))}
        {ativos.length === 0 && <li className="p-4 text-center text-suave">Nenhum produto ativo.</li>}
      </ul>

      <h2 className="mt-8 text-lg font-semibold">Inativos ({inativos.length})</h2>
      <ul className="mt-2 divide-y divide-linha rounded-lg border border-linha bg-fundo/50">
        {inativos.map((p) => (
          <LinhaProduto key={p.id} produto={p} />
        ))}
        {inativos.length === 0 && <li className="p-4 text-center text-suave">Nenhum produto inativo.</li>}
      </ul>
    </div>
  );
}

/** Aplica a mudança na hora na tela, enquanto o servidor salva. */
function aplicar(d: DisponibilidadeProduto, m: MudancaProduto): DisponibilidadeProduto {
  const alternar = (lista: string[] | undefined, item: string, incluir: boolean) => {
    const sem = (lista ?? []).filter((i) => i !== item);
    return incluir ? [...sem, item] : sem;
  };
  if (m.tipo === "ativo") return { ...d, inativo: !m.valor || undefined };
  if (m.tipo === "cor") return { ...d, coresInativas: alternar(d.coresInativas, m.cor, !m.valor) };
  if (m.tipo === "tamanho") return { ...d, tamanhosInativos: alternar(d.tamanhosInativos, m.tamanho, !m.valor) };
  return { ...d, esgotados: alternar(d.esgotados, `${m.cor}|${m.tamanho}`, !m.valor) };
}

function textoPreco(p: ProdutoPainel) {
  if (p.preco <= 0) return "Preço em breve";
  const valores = Object.values(p.precosTamanho ?? {});
  if (valores.length) {
    const min = Math.min(p.preco, ...valores);
    const max = Math.max(p.preco, ...valores);
    if (min !== max) return `${formatarPreco(min)} a ${formatarPreco(max)}`;
  }
  return formatarPreco(p.preco);
}

function LinhaProduto({ produto: p }: { produto: ProdutoPainel }) {
  const [d, aplicarNaTela] = useOptimistic(p.disponibilidade, aplicar);
  const [, iniciar] = useTransition();
  const [aberto, setAberto] = useState(false);
  const ativo = !d.inativo;
  const desligados = (d.coresInativas?.length ?? 0) + (d.tamanhosInativos?.length ?? 0) + (d.esgotados?.length ?? 0);

  function mudar(m: MudancaProduto) {
    iniciar(async () => {
      aplicarNaTela(m);
      await mudarProduto(p.id, m);
    });
  }

  return (
    <li className="p-3">
      <div className="flex items-start gap-3">
        <FotoProduto
          src={p.foto}
          alt={p.nome}
          cores={p.cores}
          sizes="56px"
          className={`h-[70px] w-14 shrink-0 rounded ${ativo ? "" : "opacity-50 grayscale"}`}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">{p.nome}</p>
          <p className="text-xs text-suave">{p.referencia}</p>
          <p className="mt-1 text-sm">
            Venda: <strong>{textoPreco(p)}</strong>
            {p.precoDe && p.precoDe > p.preco && <span className="ml-1 text-xs text-suave line-through">{formatarPreco(p.precoDe)}</span>}
          </p>
          <CampoCusto produto={p} />
        </div>
        <button
          type="button"
          onClick={() => mudar({ tipo: "ativo", valor: !ativo })}
          className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold ${
            ativo ? "border border-linha text-texto" : "bg-sucesso text-white"
          }`}
        >
          {ativo ? "Inativar" : "Ativar"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className="mt-2 flex items-center gap-1 text-sm text-suave"
        aria-expanded={aberto}
      >
        <svg
          viewBox="0 0 24 24"
          className={`size-4 transition-transform ${aberto ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        Variações
        {desligados > 0 && <span className="text-promo">· {desligados} desligada{desligados > 1 ? "s" : ""}</span>}
      </button>

      {aberto && <Variacoes produto={p} d={d} mudar={mudar} />}
    </li>
  );
}

function CampoCusto({ produto: p }: { produto: ProdutoPainel }) {
  const inicial = p.custo !== undefined ? p.custo.toFixed(2).replace(".", ",") : "";
  const [valor, setValor] = useState(inicial);
  const [erro, setErro] = useState("");
  const [salvando, iniciar] = useTransition();
  const custo = Number(valor.replace(/\./g, "").replace(",", "."));
  const lucroPeca = valor && Number.isFinite(custo) && p.preco > 0 ? p.preco - custo : null;

  function salvar() {
    if (valor === inicial) return;
    iniciar(async () => setErro(await mudarCusto(p.id, valor)));
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <label className="flex items-center gap-1.5">
        Custo R$
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={salvar}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          inputMode="decimal"
          placeholder="0,00"
          className="w-24 rounded border border-linha px-2 py-1"
        />
      </label>
      {salvando && <span className="text-xs text-suave">salvando...</span>}
      {erro && <span className="text-xs text-promo">{erro}</span>}
      {!salvando && !erro && lucroPeca !== null && (
        <span className={`text-xs ${lucroPeca < 0 ? "text-promo" : "text-sucesso"}`}>lucro {formatarPreco(lucroPeca)} por peça</span>
      )}
    </div>
  );
}

function Variacoes({
  produto: p,
  d,
  mudar,
}: {
  produto: ProdutoPainel;
  d: DisponibilidadeProduto;
  mudar: (m: MudancaProduto) => void;
}) {
  const chip = "min-w-11 rounded-md border px-2.5 py-1.5 text-sm";

  return (
    <div className="mt-2 grid gap-4 rounded-md bg-fundo p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-suave">Tamanhos (em todas as cores)</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {p.tamanhos.map((t) => {
            const ligado = !d.tamanhosInativos?.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => mudar({ tipo: "tamanho", tamanho: t, valor: !ligado })}
                className={`${chip} ${ligado ? "border-sucesso bg-white text-texto" : "border-linha bg-neutral-200 text-suave line-through"}`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-suave">Cores · toque no tamanho para marcar esgotado</p>
        <ul className="mt-1.5 grid gap-3">
          {p.cores.map((c) => {
            const corLigada = !d.coresInativas?.includes(c.nome);
            return (
              <li key={c.nome} className="rounded-md bg-white p-2">
                <div className="flex items-center gap-2">
                  <BolinhaCor hex={c.hex} amostra={c.amostra} className={`size-7 ${corLigada ? "" : "opacity-40"}`} />
                  <span className={`min-w-0 flex-1 text-sm ${corLigada ? "" : "text-suave line-through"}`}>{c.nome}</span>
                  <button
                    type="button"
                    onClick={() => mudar({ tipo: "cor", cor: c.nome, valor: !corLigada })}
                    className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${
                      corLigada ? "border border-linha" : "bg-sucesso text-white"
                    }`}
                  >
                    {corLigada ? "Inativar cor" : "Ativar cor"}
                  </button>
                </div>
                {corLigada && (
                  <div className="mt-2 flex flex-wrap gap-2 pl-9">
                    {p.tamanhos.map((t) => {
                      const tamanhoLigado = !d.tamanhosInativos?.includes(t);
                      const esgotado = Boolean(d.esgotados?.includes(`${c.nome}|${t}`));
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={!tamanhoLigado}
                          onClick={() => mudar({ tipo: "combinacao", cor: c.nome, tamanho: t, valor: esgotado })}
                          className={`${chip} disabled:opacity-30 ${
                            esgotado || !tamanhoLigado
                              ? "border-linha bg-neutral-200 text-suave line-through"
                              : "border-sucesso bg-white"
                          }`}
                          aria-label={`${c.nome} ${t}: ${esgotado ? "esgotado" : "disponível"}`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
