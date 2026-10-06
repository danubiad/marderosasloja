import type { Metadata } from "next";
import { IconeWhatsapp } from "@/components/icones";
import { formatarPreco, formatarTelefone } from "@/lib/format";
import { listarPedidos } from "@/lib/pedidos";
import { listarRevendedoras } from "@/lib/revendedoras";
import { mudarStatusRevendedora } from "../actions";
import { AbasPainel } from "../AbasPainel";
import { bloqueioPainel, linkWhatsapp, momentoAtual, tempoAtras } from "../acesso";
import { loja } from "@/lib/config";

export const metadata: Metadata = {
  title: "Revendedoras — Painel Mar de Rosas",
  robots: { index: false, follow: false },
};

const etiquetas = {
  pendente: { nome: "Ativa", cor: "bg-green-100 text-green-900" },
  ativa: { nome: "Ativa", cor: "bg-green-100 text-green-900" },
  bloqueada: { nome: "Bloqueada", cor: "bg-neutral-200 text-neutral-700" },
};

export default async function Revendedoras() {
  const bloqueio = await bloqueioPainel();
  if (bloqueio) return bloqueio;

  const [lista, pedidos] = await Promise.all([listarRevendedoras(), listarPedidos()]);
  const agora = momentoAtual();

  return (
    <>
      <AbasPainel atual="/painel/revendedoras" />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-5">
        <p className="rounded-md bg-creme px-4 py-3 text-sm">
          As revendedoras se cadastram em <strong>/revendedora</strong> e o catálogo entra no ar na hora (aprovação automática). Se precisar, use Bloquear para tirar um catálogo do ar
          . Envie este link para quem quiser revender: <code className="font-semibold">{loja.dominio}/revendedora</code>
        </p>

        {lista.length === 0 ? (
          <p className="py-20 text-center text-suave">Nenhuma revendedora cadastrada ainda.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {lista.map((r) => {
              const dela = pedidos.filter((p) => p.revendedora?.usuario === r.usuario && p.status !== "cancelado");
              const atacado = dela.reduce((a, p) => a + (p.totalAtacado ?? p.total), 0);
              return (
                <li key={r.usuario} className="rounded-lg border border-linha p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold">{r.nome}</p>
                      <p className="text-sm text-suave">
                        /r/{r.usuario} · margem {r.margem}% · cadastro {tempoAtras(r.criadoEm, agora)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${etiquetas[r.status].cor}`}>
                      {etiquetas[r.status].nome}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">
                    {dela.length} {dela.length === 1 ? "pedido" : "pedidos"} · {formatarPreco(atacado)} no atacado
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.status === "bloqueada" && (
                      <form action={mudarStatusRevendedora.bind(null, r.usuario, "ativa")}>
                        <button type="submit" className="rounded-md bg-sucesso px-3 py-2 text-sm font-semibold text-white">
                          Reativar
                        </button>
                      </form>
                    )}
                    {r.status !== "bloqueada" && (
                      <a
                        href={`/r/${r.usuario}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-linha px-3 py-2 text-sm font-semibold"
                      >
                        Ver catálogo
                      </a>
                    )}
                    {r.status !== "bloqueada" && (
                      <form action={mudarStatusRevendedora.bind(null, r.usuario, "bloqueada")}>
                        <button type="submit" className="rounded-md border border-promo px-3 py-2 text-sm font-semibold text-promo">
                          Bloquear
                        </button>
                      </form>
                    )}
                    <a
                      href={linkWhatsapp(r.whatsapp, `Olá, ${r.nome.split(" ")[0]}! Aqui é da Mar de Rosas.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-md bg-fundo px-3 py-2 text-sm font-semibold"
                    >
                      <IconeWhatsapp className="size-4 text-sucesso" /> {formatarTelefone(r.whatsapp)}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
