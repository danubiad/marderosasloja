import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AtualizarSozinho } from "@/components/AtualizarSozinho";
import { formatarPreco } from "@/lib/format";
import { listarPedidosDaRevendedora, resumoConferencia, statusPedido } from "@/lib/pedidos";
import { revendedoraLogada } from "@/lib/revendedoras";
import { sairRevendedora } from "../actions";
import { CompartilharLink } from "./CompartilharLink";
import { FormPerfil } from "./FormPerfil";

export const metadata: Metadata = {
  title: "Minha área — Revendedora Mar de Rosas",
  robots: { index: false, follow: false },
};

export default async function PainelRevendedora() {
  const r = await revendedoraLogada();
  if (!r) redirect("/revendedora");
  const pedidos = await listarPedidosDaRevendedora(r.usuario);
  const ativos = pedidos.filter((p) => p.status !== "cancelado");

  return (
    <>
      <AtualizarSozinho segundos={20} />
      <header className="border-b border-linha bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-suave">Revendedora Mar de Rosas</p>
            <h1 className="truncate text-xl font-semibold">{r.nome}</h1>
          </div>
          <form action={sairRevendedora}>
            <button type="submit" className="rounded-md border border-linha px-3 py-1.5 text-sm">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-5">
        {r.status === "pendente" ? (
          <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">Cadastro em análise</p>
            <p className="mt-1 text-sm text-amber-900">
              Seu catálogo <strong>/r/{r.usuario}</strong> fica no ar assim que a Mar de Rosas aprovar. Enquanto isso, você já pode
              ajustar sua margem abaixo.
            </p>
          </section>
        ) : (
          <section className="rounded-lg border border-linha p-4">
            <p className="text-sm text-suave">Seu catálogo</p>
            <p className="break-all text-lg font-semibold">marderosasloja.vercel.app/r/{r.usuario}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CompartilharLink caminho={`/r/${r.usuario}`} nome={r.nome} />
              <Link href={`/r/${r.usuario}`} target="_blank" className="rounded-md border border-linha px-4 py-2.5 font-semibold">
                Abrir catálogo
              </Link>
            </div>
          </section>
        )}

        <section className="mt-4 rounded-lg border border-linha p-4">
          <h2 className="mb-3 text-lg font-semibold">Meu perfil</h2>
          <FormPerfil nome={r.nome} margem={r.margem} />
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold">Meus pedidos</h2>
          <p className="text-sm text-suave">
            {ativos.length} {ativos.length === 1 ? "pedido" : "pedidos"} · {formatarPreco(ativos.reduce((a, p) => a + p.total, 0))} em
            vendas · você paga {formatarPreco(ativos.reduce((a, p) => a + (p.totalAtacado ?? 0), 0))} no atacado
          </p>

          {pedidos.length === 0 ? (
            <p className="py-12 text-center text-suave">Nenhum pedido ainda. Compartilhe seu catálogo com suas clientes!</p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {pedidos.map((p) => {
                const conf = resumoConferencia(p);
                return (
                  <li key={p.id}>
                    <Link href={`/revendedora/pedido/${p.id}`} className="block rounded-lg border border-linha p-4 hover:bg-creme">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold">
                            Pedido {p.numero} · {p.cliente.nome}
                          </p>
                          <p className="text-sm text-suave">
                            {new Date(p.criadoEm).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} · {conf.pecas} peças ·{" "}
                            {formatarPreco(conf.total)}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-fundo px-2.5 py-1 text-xs font-semibold">
                          {statusPedido[p.status ?? "novo"]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">
                        {conf.conferidos === 0 ? (
                          <span className="text-suave">Aguardando conferência da loja</span>
                        ) : (
                          <>
                            <span className="text-sucesso">✓ {conf.conferidos} de {conf.totalLinhas} conferidos</span>
                            {conf.faltas > 0 && <span className="font-semibold text-promo"> · ✕ {conf.faltas} em falta: escolha a troca</span>}
                          </>
                        )}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
