import type { Metadata } from "next";
import { lerConcorrentes, type Concorrente } from "@/lib/concorrentes";
import { AbasPainel } from "../AbasPainel";
import { bloqueioPainel } from "../acesso";

export const metadata: Metadata = {
  title: "Concorrentes — Painel Mar de Rosas",
  robots: { index: false, follow: false },
};

// Só mostra: a lista e a coleta diária (6h) ficam no DonaSystem (Conteúdo → Concorrentes Loja).

const num = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("pt-BR"));
const sinal = (n: number | null) => (n == null ? "—" : (n > 0 ? "+" : "") + n.toLocaleString("pt-BR"));
const cor = (n: number | null) => (n == null ? "text-suave" : n > 0 ? "text-sucesso" : n < 0 ? "text-promo" : "text-texto");
const diaBr = (d: string | null) => (d ? d.split("-").reverse().slice(0, 2).join("/") : "");
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesTexto = (m: string) => `${MESES[Number(m.slice(5, 7)) - 1]}/${m.slice(0, 4)}`;
// Faixa do Google (Chrome UX Report, Brasil): 50000 = entre os 50 mil sites mais visitados do Brasil
const faixaTexto = (f: number | null) =>
  f == null ? "abaixo do top 1 milhão" : `top ${f >= 1_000_000 ? "1 milhão" : (f / 1000).toLocaleString("pt-BR") + " mil"}`;
const tipoPost = (t: string) => (t === "CAROUSEL_ALBUM" ? "Carrossel" : t === "IMAGE" ? "Foto" : t === "VIDEO" ? "Vídeo" : t);

function Numero({ rotulo, valor, classe, dica }: { rotulo: string; valor: string; classe?: string; dica?: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-fundo p-3">
      <p className="truncate text-[11px] uppercase tracking-wide text-suave">{rotulo}</p>
      <p className={`truncate text-lg font-semibold ${classe ?? "text-texto"}`}>{valor}</p>
      {dica && <p className="truncate text-[11px] text-suave">{dica}</p>}
    </div>
  );
}

function Linha({ serie }: { serie: Concorrente["serie"] }) {
  const pts = serie.filter((s): s is { dia: string; seguidores: number } => s.seguidores != null);
  if (pts.length < 2) return null;
  const min = Math.min(...pts.map((p) => p.seguidores));
  const max = Math.max(...pts.map((p) => p.seguidores));
  const xy = pts.map((p, i) => `${(i / (pts.length - 1)) * 300},${46 - ((p.seguidores - min) / (max - min || 1)) * 42}`);
  return (
    <div>
      <svg viewBox="0 0 300 50" preserveAspectRatio="none" className="h-12 w-full" aria-label="Seguidores por dia">
        <polyline points={xy.join(" ")} fill="none" stroke="var(--color-dourado-escuro)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-[10px] text-suave">
        <span>{diaBr(pts[0].dia)}</span>
        <span>seguidores por dia</span>
        <span>{diaBr(pts[pts.length - 1].dia)}</span>
      </div>
    </div>
  );
}

function Cartao({ c }: { c: Concorrente }) {
  const p = c.perfil;
  const medindo = c.medindo_desde ? `medindo desde ${diaBr(c.medindo_desde)}` : "medindo a partir de hoje";
  const s = c.site_info;
  const g = s?.google ?? [];
  const ultG = g[g.length - 1];
  const antG = g[g.length - 2];
  const val = (f: number | null | undefined) => f ?? 10_000_000;
  const tendG = !ultG || !antG ? null : val(ultG.faixa) < val(antG.faixa) ? "subiu" : val(ultG.faixa) > val(antG.faixa) ? "caiu" : "igual";

  return (
    <section className="rounded-xl border border-linha bg-white">
      <div className="flex items-center gap-3 border-b border-linha p-4">
        {p?.profile_picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.profile_picture_url} alt="" referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-fundo" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{p?.name || "@" + c.instagram}</p>
          <p className="truncate text-xs text-suave">
            <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener noreferrer" className="underline">
              @{c.instagram}
            </a>
            {c.site && (
              <>
                {" · "}
                <a href={c.site} target="_blank" rel="noopener noreferrer" className="underline">
                  {c.site.replace(/^https?:\/\//, "")}
                </a>
              </>
            )}
          </p>
        </div>
        {/* Abre a Biblioteca de Anúncios do Meta (o link é guardado no DonaSystem) */}
        {c.anuncios && (
          <a
            href={c.anuncios}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-md bg-texto px-3 py-1.5 text-xs font-semibold text-white"
          >
            Anúncios ativos ↗
          </a>
        )}
      </div>

      <div className="space-y-4 p-4">
        {c.ig_erro ? (
          <p className="text-sm text-promo">Instagram: {c.ig_erro}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Numero rotulo="Seguidores" valor={num(p?.followers_count)} dica={`${num(p?.media_count)} posts no perfil`} />
              <Numero rotulo="Ganho no dia" valor={sinal(c.ganho.dia)} classe={cor(c.ganho.dia)} dica={c.ganho.dia == null ? medindo : undefined} />
              <Numero rotulo="Na semana" valor={sinal(c.ganho.semana)} classe={cor(c.ganho.semana)} dica={c.ganho.semana == null ? medindo : undefined} />
              <Numero rotulo="No mês" valor={sinal(c.ganho.mes)} classe={cor(c.ganho.mes)} dica={c.ganho.mes == null ? medindo : undefined} />
              <Numero rotulo="Posts por dia" valor={c.posts_por_dia.semana.toLocaleString("pt-BR")} dica={`na semana · ${c.posts_por_dia.mes.toLocaleString("pt-BR")} no mês`} />
              <Numero
                rotulo="Posts em 30 dias"
                valor={String(c.posts_30d)}
                dica={Object.entries(c.tipos_30d).map(([t, n]) => `${n} ${t}`).join(" · ") || "nenhum"}
              />
              <Numero
                rotulo="Engajamento"
                valor={c.engajamento_medio == null ? "—" : `${c.engajamento_medio.toLocaleString("pt-BR")}%`}
                dica="curtidas + comentários ÷ seguidores"
              />
              <Numero
                rotulo="Produtos no site"
                valor={s ? num(s.produtos) : "—"}
                classe={s ? cor(s.variacao.semana) : undefined}
                dica={!s ? "sem site" : s.erro ? "não deu para contar" : s.variacao.semana == null ? "medindo" : `${sinal(s.variacao.semana)} na semana`}
              />
            </div>

            <Linha serie={c.serie} />

            {c.top.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wide text-suave">Mais engajados (30 dias)</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {c.top.map((t) => (
                    <a key={t.link} href={t.link} target="_blank" rel="noopener noreferrer" title={t.legenda} className="block">
                      <div className="aspect-[4/5] overflow-hidden rounded-md bg-fundo">
                        {t.imagem && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.imagem} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <p className="mt-1 text-[11px]">
                        ♥ {num(t.curtidas)} · 💬 {num(t.comentarios)}
                      </p>
                      <p className="text-[10px] text-suave">{tipoPost(t.tipo)}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {s && (
          <div className="rounded-lg bg-fundo p-3 text-sm">
            <p className="font-semibold">Site{s.plataforma ? ` (${s.plataforma})` : ""}</p>
            {s.erro ? (
              <p className="text-promo">{s.erro}</p>
            ) : (
              <p className="text-suave">
                {num(s.produtos)} produtos no ar.
                {s.variacao.semana != null && <> Na semana: <span className={cor(s.variacao.semana)}>{sinal(s.variacao.semana)}</span>.</>}
                {s.variacao.mes != null && <> No mês: <span className={cor(s.variacao.mes)}>{sinal(s.variacao.mes)}</span>.</>}
                {s.novos_7d > 0 && <> {s.novos_7d} produto(s) novo(s) nos últimos 7 dias.</>}
              </p>
            )}
            {ultG && (
              <p className="mt-1 text-suave">
                Google (popularidade no Brasil, {mesTexto(ultG.mes)}): <b className="text-texto">{faixaTexto(ultG.faixa)}</b>
                {tendG === "subiu" && <span className="text-sucesso"> · subiu de faixa</span>}
                {tendG === "caiu" && <span className="text-promo"> · caiu de faixa</span>}
                {tendG === "igual" && <> · mesma faixa do mês anterior</>}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default async function Concorrentes() {
  const bloqueio = await bloqueioPainel();
  if (bloqueio) return bloqueio;

  const r = await lerConcorrentes();
  const lista = r.ok ? [...r.concorrentes].sort((a, b) => (b.perfil?.followers_count ?? 0) - (a.perfil?.followers_count ?? 0)) : [];

  return (
    <>
      <AbasPainel atual="/painel/concorrentes" />
      <main className="mx-auto w-full max-w-5xl space-y-5 px-4 pb-16 pt-5">
        <p className="text-sm text-suave">
          Instagram e site dos concorrentes, atualizados todo dia às 6h. Para adicionar ou tirar alguém, use o DonaSystem (Conteúdo →
          Concorrentes Loja).
        </p>

        {!r.ok && <p className="rounded-lg bg-fundo p-4 text-sm text-promo">{r.erro}</p>}
        {r.ok && lista.length === 0 && <p className="text-sm text-suave">Nenhum concorrente na lista ainda.</p>}

        {lista.length > 1 && (
          <div className="overflow-x-auto rounded-xl border border-linha bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-suave">
                  <th className="p-3">Concorrente</th>
                  <th className="p-3">Seguidores</th>
                  <th className="p-3">Semana</th>
                  <th className="p-3">Mês</th>
                  <th className="p-3">Posts/dia</th>
                  <th className="p-3">Engajamento</th>
                  <th className="p-3">Produtos</th>
                  <th className="p-3">Google</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => {
                  const g = c.site_info?.google ?? [];
                  return (
                    <tr key={c.id} className="border-t border-linha">
                      <td className="p-3 font-medium">@{c.instagram}</td>
                      <td className="p-3">{num(c.perfil?.followers_count)}</td>
                      <td className={`p-3 ${cor(c.ganho.semana)}`}>{sinal(c.ganho.semana)}</td>
                      <td className={`p-3 ${cor(c.ganho.mes)}`}>{sinal(c.ganho.mes)}</td>
                      <td className="p-3">{c.posts_por_dia.semana.toLocaleString("pt-BR")}</td>
                      <td className="p-3">{c.engajamento_medio == null ? "—" : `${c.engajamento_medio.toLocaleString("pt-BR")}%`}</td>
                      <td className="p-3">{num(c.site_info?.produtos)}</td>
                      <td className="p-3">{g.length ? faixaTexto(g[g.length - 1].faixa) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {lista.map((c) => (
            <Cartao key={c.id} c={c} />
          ))}
        </div>
      </main>
    </>
  );
}
