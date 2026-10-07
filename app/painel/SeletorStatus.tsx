"use client";

import { useTransition } from "react";
import { mudarStatus } from "./actions";

const cores: Record<string, string> = {
  novo: "bg-amber-100 text-amber-900 border-amber-300",
  confirmado: "bg-emerald-100 text-emerald-900 border-emerald-300",
  separando: "bg-sky-100 text-sky-900 border-sky-300",
  enviado: "bg-violet-100 text-violet-900 border-violet-300",
  concluido: "bg-green-100 text-green-900 border-green-300",
  cancelado: "bg-neutral-200 text-neutral-600 border-neutral-300",
};

type Props = { id: string; status: string; opcoes: Record<string, string> };

export function SeletorStatus({ id, status, opcoes }: Props) {
  const [salvando, iniciar] = useTransition();

  return (
    <select
      value={status}
      disabled={salvando}
      onChange={(e) => {
        const novo = e.target.value;
        iniciar(() => mudarStatus(id, novo));
      }}
      className={`rounded-full border px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${cores[status] ?? ""}`}
      aria-label="Status do pedido"
    >
      {Object.entries(opcoes).map(([valor, nome]) => (
        <option key={valor} value={valor}>
          {nome}
        </option>
      ))}
    </select>
  );
}
