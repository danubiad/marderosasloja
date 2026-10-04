"use client";

import { useState } from "react";
import { BolinhaCor } from "@/components/BolinhaCor";
import { chaveGrade, type Grade } from "@/lib/calculo";

type Props = {
  cores: { nome: string; hex: string; amostra?: string }[];
  tamanhos: string[];
  grade: Grade;
  onChange?: (grade: Grade) => void;
  /** Mostra apenas as cores que têm quantidade (usado no carrinho e no pedido) */
  somenteComQuantidade?: boolean;
  /** Mostra o botão de teclado para digitar quantidades */
  permitirDigitar?: boolean;
};

export function GradeQuantidade({
  cores,
  tamanhos,
  grade,
  onChange,
  somenteComQuantidade,
  permitirDigitar,
}: Props) {
  const [digitando, setDigitando] = useState(false);
  const editavel = Boolean(onChange);

  const linhas = somenteComQuantidade
    ? cores.filter((cor) => tamanhos.some((t) => (grade[chaveGrade(cor.nome, t)] ?? 0) > 0))
    : cores;

  function alterar(cor: string, tamanho: string, quantidade: number) {
    onChange?.({ ...grade, [chaveGrade(cor, tamanho)]: Math.max(0, Math.min(9999, quantidade)) });
  }

  return (
    <div>
      {editavel && permitirDigitar && (
        <button
          type="button"
          onClick={() => setDigitando((d) => !d)}
          className={`mb-3 flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
            digitando ? "border-texto bg-texto text-white" : "border-linha text-suave"
          }`}
          aria-pressed={digitando}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" strokeLinecap="round" />
          </svg>
          {digitando ? "Usar botões + / −" : "Digitar quantidades"}
        </button>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr>
              <th className="w-24 min-w-20" />
              {tamanhos.map((t) => (
                <th key={t} className="border-l border-linha px-1 py-3 text-lg font-normal">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((cor) => (
              <tr key={cor.nome} className="border-t border-white">
                <th scope="row" className="bg-fundo px-1 py-2 font-normal">
                  <div className="flex flex-col items-center gap-1">
                    <BolinhaCor hex={cor.hex} amostra={cor.amostra} className="size-10" />
                    <span className="text-xs leading-tight text-suave">{cor.nome}</span>
                  </div>
                </th>
                {tamanhos.map((t) => {
                  const q = grade[chaveGrade(cor.nome, t)] ?? 0;
                  return (
                    <td key={t} className={`border-l border-linha p-0 ${somenteComQuantidade ? "bg-fundo" : ""}`}>
                      {!editavel ? (
                        <span className="text-lg">{q > 0 ? q : ""}</span>
                      ) : digitando ? (
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={q || ""}
                          placeholder="0"
                          onChange={(e) => alterar(cor.nome, t, Number(e.target.value) || 0)}
                          className="mx-auto block w-14 rounded border border-linha py-2 text-center text-lg"
                          aria-label={`Quantidade ${cor.nome} tamanho ${t}`}
                        />
                      ) : q === 0 ? (
                        <button
                          type="button"
                          onClick={() => alterar(cor.nome, t, 1)}
                          className="h-20 w-full text-2xl font-light text-suave hover:bg-fundo"
                          aria-label={`Adicionar ${cor.nome} tamanho ${t}`}
                        >
                          +
                        </button>
                      ) : (
                        <div className="flex h-20 flex-col items-center justify-between py-1">
                          <button
                            type="button"
                            onClick={() => alterar(cor.nome, t, q + 1)}
                            className="w-full text-lg leading-none text-suave"
                            aria-label={`Mais uma ${cor.nome} tamanho ${t}`}
                          >
                            +
                          </button>
                          <span className="text-xl font-semibold">{q}</span>
                          <button
                            type="button"
                            onClick={() => alterar(cor.nome, t, q - 1)}
                            className="w-full text-lg leading-none text-suave"
                            aria-label={`Menos uma ${cor.nome} tamanho ${t}`}
                          >
                            −
                          </button>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
