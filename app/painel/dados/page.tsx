import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AtualizarSozinho } from "@/components/AtualizarSozinho";
import { diaDaSemana, diaSP, diasNoMes, ultimosDias } from "@/lib/datas";
import { lerRegistros, salvarRegistro } from "@/lib/diario";
import { somarEventos } from "@/lib/eventos";
import { formatarPreco } from "@/lib/format";
import { buscarConexaoMeta, gastosMeta, seguidoresInstagram } from "@/lib/meta-ads";
import { buscarMetaDiaria } from "@/lib/metas";
import { listarPedidos, type Pedido, type StatusPedido } from "@/lib/pedidos";
import { desconectarMetaAds, mudarMetaDiaria, mudarRegistroDia } from "../actions";
import { AbasPainel } from "../AbasPainel";
import { bloqueioPainel, momentoAtual } from "../acesso";
import { FormConectarMeta } from "./FormConectarMeta";

export const metadata: Metadata = {
  title: "Dados — Painel Mar de Rosas",
  robots: { index: false, follow: false },
};

/** Status que contam como venda fechada (o mesmo critério da compra enviada ao Meta). */
const vendaFechada: StatusPedido[] = ["confirmado", "separando", "enviado", "concluido"];

const periodos = {
  hoje: "Hoje",
  ontem: "Ontem",
  "7d": "7 dias",
  "30d": "30 dias",
  mes: "Este mês",
} as const;
type Periodo = keyof typeof periodos;

function diasDoPeriodo(periodo: Periodo, agora: number) {
  const hoje = diaSP(agora);
  if (periodo === "hoje") return [hoje];
  if (periodo === "ontem") return [ultimosDias(2, agora)[1]];
  if (periodo === "7d") return ultimosDias(7, agora);
  if (periodo === "30d") return ultimosDias(30, agora);
  return ultimosDias(Number(hoje.slice(8)), agora);
}

const valorVenda = (p: Pedido) => p.totalAtacado ?? p.total;
const somaVendas = (lista: Pedido[]) => lista.reduce((t, p) => t + valorVenda(p), 0);
const pct = (parte: number, todo: number) => (todo > 0 ? Math.round((parte / todo) * 100) : 0);
const numero = (n: number) => n.toLocaleString("pt-BR");

export default async function Dados({ searchParams }: PageProps<"/painel/dados">) {
  const bloqueio = await bloqueioPainel();
  if (bloqueio) return bloqueio;

  const { periodo: periodoParam, dia: diaParam } = await searchParams;
  const periodo: Periodo = typeof periodoParam === "string" && periodoParam in periodos ? (periodoParam as Periodo) : "7d";
  const agora = momentoAtual();
  const hoje = diaSP(agora);
  const dias = diasDoPeriodo(periodo, agora);
  // Dia aberto no formulário "Registrar o dia"
  const diaForm = typeof diaParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(diaParam) && diaParam <= hoje ? diaParam : hoje;
  // Para o crescimento do Instagram, olha também até 60 dias antes do período (último número anotado)
  const diasAntes = ultimosDias(dias.length + 60, agora).filter((d) => d < dias.at(-1)!);

  const [eventos, todos, metaDiaria, registros, conexao] = await Promise.all([
    somarEventos(dias),
    listarPedidos(2000),
    buscarMetaDiaria(),
    lerRegistros([...new Set([...dias, ...diasAntes, diaForm, hoje])]),
    buscarConexaoMeta(),
  ]);

  // Dados automáticos do Meta: gasto da conta de anúncios e seguidores do Instagram (guardados no dia de hoje)
  const [gastosAuto, seguidoresAgora] = conexao
    ? await Promise.all([gastosMeta(conexao, dias.at(-1)!, dias[0]), seguidoresInstagram(conexao)])
    : [null, null];
  if (seguidoresAgora !== null && registros[hoje].seguidores !== seguidoresAgora) {
    registros[hoje] = { ...registros[hoje], seguidores: seguidoresAgora };
    await salvarRegistro(hoje, { seguidores: seguidoresAgora });
  }
  const gastoDoDia = (d: string) =>
    gastosAuto === null && registros[d].gasto === undefined ? undefined : (gastosAuto?.[d] ?? 0) + (registros[d].gasto ?? 0);
  const doDia = (p: Pedido) => diaSP(p.criadoEm);
  const vendas = todos.filter((p) => vendaFechada.includes(p.status ?? "novo"));

  // Período escolhido
  const noPeriodo = new Set(dias);
  const recebidos = todos.filter((p) => p.status !== "cancelado" && noPeriodo.has(doDia(p)));
  const vendasPeriodo = vendas.filter((p) => noPeriodo.has(doDia(p)));
  const aguardando = recebidos.filter((p) => (p.status ?? "novo") === "novo");
  const totalVendido = somaVendas(vendasPeriodo);
  const ticketMedio = vendasPeriodo.length ? totalVendido / vendasPeriodo.length : 0;
  const pecasMedias = vendasPeriodo.length ? vendasPeriodo.reduce((t, p) => t + p.pecas, 0) / vendasPeriodo.length : 0;

  // Tráfego, Instagram e WhatsApp (anotados no painel)
  const gasto = dias.reduce((t, d) => t + (gastoDoDia(d) ?? 0), 0);
  const roas = gasto > 0 ? totalVendido / gasto : null;
  const mensagens = dias.reduce((t, d) => t + (registros[d].mensagens ?? 0), 0);
  const diasComMensagens = dias.filter((d) => registros[d].mensagens !== undefined).length;
  // `dias` vai de hoje para trás; `diasAntes` também
  const seguidoresNoPeriodo = dias.map((d) => registros[d].seguidores).filter((s) => s !== undefined);
  const seguidoresAntes = diasAntes.map((d) => registros[d].seguidores).find((s) => s !== undefined);
  const seguidoresAtual = seguidoresNoPeriodo[0] ?? null;
  const seguidoresInicio = seguidoresAntes ?? seguidoresNoPeriodo.at(-1) ?? null;
  const crescimento = seguidoresAtual !== null && seguidoresInicio !== null ? seguidoresAtual - seguidoresInicio : null;
  const vendasPorDia = (d: string) => somaVendas(vendasPeriodo.filter((p) => doDia(p) === d));
  const registroForm = registros[diaForm];

  // Metas: semana de segunda a domingo, mês do dia 1 até hoje
  const diaDoMes = Number(hoje.slice(8));
  const totalDiasMes = diasNoMes(hoje);
  const semana = new Set(ultimosDias(((diaDaSemana(hoje) + 6) % 7) + 1, agora));
  const mes = new Set(ultimosDias(diaDoMes, agora));
  const vendidoHoje = somaVendas(vendas.filter((p) => doDia(p) === hoje));
  const vendidoSemana = somaVendas(vendas.filter((p) => semana.has(doDia(p))));
  const vendidoMes = somaVendas(vendas.filter((p) => mes.has(doDia(p))));
  const metaMes = metaDiaria * totalDiasMes;
  const projecao = (vendidoMes / diaDoMes) * totalDiasMes;

  // Ranking: peças vendidas por produto no período
  const porProduto = new Map<string, { nome: string; referencia: string; foto?: string; pecas: number; valor: number }>();
  for (const p of vendasPeriodo)
    for (const i of p.itens) {
      const r = porProduto.get(i.produtoId) ?? { nome: i.nome, referencia: i.referencia, foto: i.foto, pecas: 0, valor: 0 };
      r.pecas += i.pecas;
      r.valor += (i.precoAtacado ?? i.preco) * i.pecas;
      porProduto.set(i.produtoId, r);
    }
  const ranking = [...porProduto.values()].sort((a, b) => b.pecas - a.pecas || b.valor - a.valor).slice(0, 10);

  const funil = [
    { nome: "Sessões", valor: eventos.sessao, dica: "Visitas ao catálogo (uma por aba aberta)" },
    { nome: "Viram um produto", valor: eventos.produto, dica: "Aberturas da página de um produto" },
    { nome: "Adicionaram ao carrinho", valor: eventos.carrinho, dica: "Primeira peça de um produto no carrinho" },
    { nome: "Enviaram pelo WhatsApp", valor: eventos.whatsapp, dica: "Cliques em “Enviar pedido no WhatsApp”" },
  ];
  const origens = Object.entries(eventos.origens).sort((a, b) => b[1] - a[1]);
  const campanhas = Object.entries(eventos.campanhas).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <AbasPainel atual="/painel/dados" />
      <AtualizarSozinho segundos={60} />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-5">
        <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {(Object.keys(periodos) as Periodo[]).map((p) => (
            <Link
              key={p}
              href={`/painel/dados?periodo=${p}`}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${periodo === p ? "bg-texto text-white" : "bg-fundo"}`}
            >
              {periodos[p]}
            </Link>
          ))}
        </nav>

        {/* 1. Eventos do site */}
        <Secao titulo="Comportamento no site" nota="Só o catálogo da loja (sem os catálogos das revendedoras). Contagem desde 06/10/2026.">
          <ul className="flex flex-col gap-3">
            {funil.map((f, i) => (
              <li key={f.nome} title={f.dica}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{f.nome}</span>
                  <span>
                    <strong className="text-base">{numero(f.valor)}</strong>
                    {i > 0 && <span className="text-suave"> · {pct(f.valor, eventos.sessao)}% das sessões</span>}
                  </span>
                </div>
                <Barra parte={f.valor} todo={Math.max(eventos.sessao, f.valor)} />
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Lista titulo="Origem das visitas (UTM)" itens={origens} total={eventos.sessao} vazio="Nenhuma visita no período." />
            {campanhas.length > 0 && <Lista titulo="Campanhas (utm_campaign)" itens={campanhas} total={eventos.sessao} />}
          </div>
        </Secao>

        <Secao
          titulo="Instagram e WhatsApp"
          nota={
            conexao?.instagram
              ? `Seguidores de @${conexao.instagram.usuario} atualizados sozinhos pelo Meta. Mensagens do WhatsApp anotadas em “Registrar o dia”.`
              : "Números anotados no painel, em “Registrar o dia”."
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Numero
              titulo="Seguidores no Instagram"
              valor={seguidoresAtual === null ? "—" : numero(seguidoresAtual)}
              detalhe={crescimento === null ? "sem números anotados" : `${crescimento >= 0 ? "+" : ""}${numero(crescimento)} no período`}
            />
            <Numero
              titulo="Mensagens no WhatsApp"
              valor={numero(mensagens)}
              detalhe={diasComMensagens ? `média de ${numero(Math.round(mensagens / diasComMensagens))} por dia` : "sem números anotados"}
            />
            <Numero
              titulo="Sessões no site"
              valor={numero(eventos.sessao)}
              detalhe={`média de ${numero(Math.round(eventos.sessao / dias.length))} por dia`}
            />
            <Numero titulo="Pedidos pelo site" valor={numero(recebidos.length)} detalhe={`${pct(recebidos.length, eventos.sessao)}% das sessões`} />
          </div>
        </Secao>

        {/* Vendas */}
        <Secao
          titulo="Vendas"
          nota="Venda = pedido Confirmado, Em separação, Enviado ou Concluído, pelo dia em que o pedido chegou. Valores no preço de atacado."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Numero titulo="Vendido" valor={formatarPreco(totalVendido)} detalhe={`${vendasPeriodo.length} ${vendasPeriodo.length === 1 ? "venda" : "vendas"}`} />
            <Numero
              titulo="Gasto com tráfego"
              valor={formatarPreco(gasto)}
              detalhe={gastosAuto ? "anúncios do Meta + anotado" : "anotado no painel"}
            />
            <Numero
              titulo="ROAS"
              valor={roas === null ? "—" : `${roas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}x`}
              detalhe={roas === null ? "anote o gasto do dia" : `cada R$ 1 virou ${formatarPreco(roas)}`}
            />
            <Numero titulo="Ticket médio" valor={formatarPreco(ticketMedio)} detalhe="por venda" />
            <Numero titulo="Peças por venda" valor={pecasMedias.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} detalhe="média" />
            <Numero
              titulo="Pedidos recebidos"
              valor={numero(recebidos.length)}
              detalhe={aguardando.length ? `${aguardando.length} aguardando confirmação` : "todos confirmados"}
            />
          </div>
        </Secao>

        <Secao titulo="Dia a dia">
          <div className="overflow-x-auto rounded-lg border border-linha">
            <table className="w-full min-w-[640px] text-right text-sm tabular-nums">
              <thead className="bg-fundo text-xs text-suave">
                <tr>
                  {["Dia", "Sessões", "Mensagens", "Seguidores", "Gasto", "Vendido", "ROAS", ""].map((t, i) => (
                    <th key={i} className={`px-3 py-2 font-medium ${i === 0 ? "text-left" : ""}`}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {dias.map((d) => {
                  const r = registros[d];
                  const vendido = vendasPorDia(d);
                  const gastoDia = gastoDoDia(d);
                  return (
                    <tr key={d} className={d === diaForm ? "bg-creme" : ""}>
                      <td className="px-3 py-2 text-left">
                        {d.slice(8)}/{d.slice(5, 7)}
                      </td>
                      <td className="px-3 py-2">{numero(eventos.sessoesPorDia[d] ?? 0)}</td>
                      <td className="px-3 py-2">{r.mensagens === undefined ? "—" : numero(r.mensagens)}</td>
                      <td className="px-3 py-2">{r.seguidores === undefined ? "—" : numero(r.seguidores)}</td>
                      <td className="px-3 py-2">{gastoDia === undefined ? "—" : formatarPreco(gastoDia)}</td>
                      <td className="px-3 py-2">{formatarPreco(vendido)}</td>
                      <td className="px-3 py-2">
                        {gastoDia ? `${(vendido / gastoDia).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}x` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/painel/dados?periodo=${periodo}&dia=${d}#registrar`} className="text-dourado-escuro underline">
                          anotar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <form id="registrar" action={mudarRegistroDia} className="mt-5 scroll-mt-28 rounded-lg bg-creme p-4">
            <h3 className="font-semibold">
              Registrar o dia {diaForm.slice(8)}/{diaForm.slice(5, 7)}
            </h3>
            <p className="mt-0.5 text-sm text-suave">
              Para outro dia, toque em “anotar” na tabela. Campo vazio não muda o que já foi anotado.
            </p>
            <input type="hidden" name="dia" value={diaForm} />
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Campo
                nome="gasto"
                titulo={conexao?.contaAnuncio ? "Outro tráfego, fora do Meta (R$)" : "Gasto com tráfego (R$)"}
                valor={registroForm.gasto}
              />
              <Campo nome="seguidores" titulo="Seguidores no Instagram" valor={registroForm.seguidores} />
              <Campo nome="mensagens" titulo="Mensagens no WhatsApp" valor={registroForm.mensagens} />
            </div>
            <button type="submit" className="mt-3 rounded-md bg-texto px-4 py-2 text-sm font-medium text-white">
              Salvar
            </button>
          </form>
        </Secao>

        {/* 2. Metas */}
        <Secao titulo="Metas">
          <div className="grid gap-5">
            <Meta titulo="Hoje" vendido={vendidoHoje} meta={metaDiaria} />
            <Meta titulo="Esta semana (seg. a dom.)" vendido={vendidoSemana} meta={metaDiaria * 7} />
            <Meta titulo={`Este mês (${totalDiasMes} dias)`} vendido={vendidoMes} meta={metaMes} />
            <div className="rounded-lg bg-creme p-4">
              <p className="text-sm text-suave">Projeção do mês, no ritmo atual (dia {diaDoMes} de {totalDiasMes})</p>
              <p className="mt-1 text-2xl font-bold">{formatarPreco(projecao)}</p>
              <Barra parte={projecao} todo={metaMes} batida={projecao >= metaMes} />
              <p className="mt-1 text-sm">
                {projecao >= metaMes ? (
                  <span className="font-semibold text-sucesso">✓ No ritmo para bater a meta do mês</span>
                ) : (
                  <>
                    {pct(projecao, metaMes)}% da meta. Para bater, faltam{" "}
                    <strong>{formatarPreco(Math.max(0, (metaMes - vendidoMes) / Math.max(1, totalDiasMes - diaDoMes + 1)))}</strong> por
                    dia até o fim do mês.
                  </>
                )}
              </p>
            </div>
          </div>

          <form action={mudarMetaDiaria} className="mt-5 flex flex-wrap items-end gap-2 text-sm">
            <label className="grid gap-1">
              <span className="text-suave">Meta diária (R$)</span>
              <input
                name="meta"
                inputMode="numeric"
                defaultValue={metaDiaria}
                className="w-36 rounded-md border border-linha px-3 py-2 outline-none focus:border-dourado"
              />
            </label>
            <button type="submit" className="rounded-md bg-texto px-4 py-2 font-medium text-white">
              Salvar meta
            </button>
            <span className="text-suave">Semana = diária × 7 · Mês = diária × dias do mês</span>
          </form>
        </Secao>

        {/* 3. Ranking */}
        <Secao titulo="10 produtos mais vendidos" nota={`Em peças, no período: ${periodos[periodo].toLowerCase()}.`}>
          {ranking.length === 0 ? (
            <p className="py-6 text-center text-suave">Nenhuma venda confirmada no período.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {ranking.map((r, i) => (
                <li key={r.referencia} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-right text-lg font-bold text-dourado-escuro">{i + 1}</span>
                  {r.foto ? (
                    <Image src={r.foto} alt="" width={44} height={56} className="h-14 w-11 shrink-0 rounded object-cover" />
                  ) : (
                    <span className="h-14 w-11 shrink-0 rounded bg-fundo" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {r.nome} <span className="font-normal text-suave">{r.referencia}</span>
                    </p>
                    <p className="text-sm">
                      <strong>{numero(r.pecas)}</strong> peças · <span className="text-suave">{formatarPreco(r.valor)}</span>
                    </p>
                    <Barra parte={r.pecas} todo={ranking[0].pecas} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Secao>

        <Secao titulo="Conexão com o Meta">
          {conexao ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-linha p-4 text-sm">
              <div className="flex-1">
                <p>
                  Anúncios:{" "}
                  {conexao.contaAnuncio ? (
                    <strong>{conexao.contaAnuncio.nome}</strong>
                  ) : (
                    <span className="text-promo">conta de anúncios não encontrada</span>
                  )}
                  {gastosAuto === null && conexao.contaAnuncio && <span className="text-promo"> (erro ao buscar o gasto)</span>}
                </p>
                <p>
                  Instagram:{" "}
                  {conexao.instagram ? <strong>@{conexao.instagram.usuario}</strong> : <span className="text-promo">não encontrado</span>}
                  {seguidoresAgora === null && conexao.instagram && <span className="text-promo"> (erro ao buscar seguidores)</span>}
                </p>
              </div>
              <form action={desconectarMetaAds}>
                <button type="submit" className="rounded-md border border-linha px-3 py-1.5">
                  Desconectar
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-lg bg-creme p-4 text-sm">
              <p>
                Conecte para o <strong>gasto com anúncios</strong> e os <strong>seguidores do Instagram</strong> entrarem sozinhos. Cole
                o token de um usuário do sistema do Meta Business com acesso à conta de anúncios e ao Instagram (permissões{" "}
                <code>ads_read</code>, <code>instagram_basic</code>, <code>pages_show_list</code> e <code>pages_read_engagement</code>).
              </p>
              <FormConectarMeta />
            </div>
          )}
        </Secao>
      </main>
    </>
  );
}

function Secao({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-2xl font-semibold">{titulo}</h2>
      {nota && <p className="mt-1 text-sm text-suave">{nota}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Barra({ parte, todo, batida }: { parte: number; todo: number; batida?: boolean }) {
  const largura = todo > 0 ? Math.min(100, (parte / todo) * 100) : 0;
  return (
    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-fundo">
      <div
        className={`h-full rounded-full ${batida ? "bg-sucesso" : "bg-dourado"}`}
        style={{ width: `${parte > 0 ? Math.max(largura, 1.5) : 0}%` }}
      />
    </div>
  );
}

function Campo({ nome, titulo, valor }: { nome: string; titulo: string; valor?: number }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-suave">{titulo}</span>
      <input
        name={nome}
        inputMode="decimal"
        defaultValue={valor === undefined ? "" : String(valor).replace(".", ",")}
        className="rounded-md border border-linha bg-white px-3 py-2 outline-none focus:border-dourado"
      />
    </label>
  );
}

function Numero({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe: string }) {
  return (
    <div className="rounded-lg border border-linha p-4">
      <p className="text-sm text-suave">{titulo}</p>
      <p className="mt-1 text-xl font-bold sm:text-2xl">{valor}</p>
      <p className="mt-0.5 text-xs text-suave">{detalhe}</p>
    </div>
  );
}

function Meta({ titulo, vendido, meta }: { titulo: string; vendido: number; meta: number }) {
  const batida = vendido >= meta;
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-medium">{titulo}</span>
        <span>
          <strong className="text-base">{formatarPreco(vendido)}</strong>
          <span className="text-suave"> de {formatarPreco(meta)} · </span>
          {batida ? <span className="font-semibold text-sucesso">✓ Meta batida</span> : <span>{pct(vendido, meta)}%</span>}
        </span>
      </div>
      <Barra parte={vendido} todo={meta} batida={batida} />
    </div>
  );
}

function Lista({ titulo, itens, total, vazio }: { titulo: string; itens: [string, number][]; total: number; vazio?: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{titulo}</h3>
      {itens.length === 0 ? (
        <p className="mt-2 text-sm text-suave">{vazio}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {itens.map(([nome, n]) => (
            <li key={nome}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate">{nome}</span>
                <span className="shrink-0">
                  {numero(n)} <span className="text-suave">· {pct(n, total)}%</span>
                </span>
              </div>
              <Barra parte={n} todo={itens[0][1]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
