"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { BolinhaCor } from "@/components/BolinhaCor";
import { FotoProduto } from "@/components/FotoProduto";
import { categorias, precoDoTamanho, produtos, type Produto } from "@/data/produtos";
import { aplicarDisponibilidade, type Disponibilidade } from "@/lib/disponibilidade";
import { formatarPreco } from "@/lib/format";
import { precoComMargem } from "@/lib/margem";
import {
  chaveConferencia,
  ehAcrescimo,
  quantidadeDaLinha,
  quantidadeSemSubstituir,
  resumoConferencia,
  type Conferencia,
  type Pedido,
  type Substituicao,
} from "@/lib/tipos-pedido";

type Modo = "cliente" | "loja" | "revendedora";

/** Devolve uma mensagem de erro, se não puder ser salvo */
type Resultado = Promise<string | void>;

type Props = {
  pedido: Pedido;
  modo: Modo;
  marcar?: (chave: string, estado: Conferencia | null) => Promise<void>;
  substituir?: (origem: string, produtoId: string, cor: string, tamanho: string, quantidade: number) => Resultado;
  removerSubstituicao?: (subId: string) => Promise<void>;
  /** Vendedora: acrescentar peça nova ao pedido */
  acrescentar?: (produtoId: string, cor: string, tamanho: string, quantidade: number) => Resultado;
  /** Vendedora: mudar a quantidade de uma linha (0 = remove) */
  mudarQuantidade?: (chave: string, quantidade: number) => Resultado;
  /** O que está inativo/esgotado: não aparece na escolha da peça */
  disponibilidade?: Disponibilidade;
};

export function ConferenciaPedido({
  pedido,
  modo,
  marcar,
  substituir,
  removerSubstituicao,
  acrescentar,
  mudarQuantidade,
  disponibilidade,
}: Props) {
  const conf = pedido.conferencia ?? {};
  const subs = pedido.substituicoes ?? [];
  const trocas = subs.filter((s) => !ehAcrescimo(s));
  const acrescimos = subs.filter(ehAcrescimo);
  const removidos = Object.values(pedido.quantidades ?? {}).filter((q) => q === 0).length;
  const r = resumoConferencia(pedido);
  const podeSubstituir = Boolean(substituir);
  const margem = pedido.revendedora?.margem ?? 0;
  const [acrescentando, setAcrescentando] = useState(false);
  const quemVende = modo === "revendedora" || pedido.revendedora ? "vendedora" : "loja";

  const linhaSub = (s: Substituicao) => {
    const chave = chaveConferencia.substituicao(s.id);
    return (
      <LinhaSubstituicao
        key={s.id}
        sub={s}
        marca={conf[chave]}
        marcar={marcar && ((e) => marcar(chave, e))}
        remover={removerSubstituicao && podeDesfazer(modo, s, conf[chave]) ? () => removerSubstituicao(s.id) : undefined}
        editar={mudarQuantidade && podeEditar(modo, conf[chave]) ? (q) => mudarQuantidade(chave, q) : undefined}
      />
    );
  };

  return (
    <div>
      {modo !== "cliente" && (
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-fundo px-3 py-1">
            Conferidos: {r.conferidos} de {r.totalLinhas}
          </span>
          {r.faltas > 0 && <span className="rounded-full bg-red-50 px-3 py-1 text-promo">{r.faltas} peça(s) em falta</span>}
          {trocas.length > 0 && <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-800">{trocas.length} substituição(ões)</span>}
          {acrescimos.length > 0 && (
            <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-800">{acrescimos.length} acrescentada(s)</span>
          )}
          {removidos > 0 && <span className="rounded-full bg-fundo px-3 py-1 text-suave">{removidos} removida(s)</span>}
        </div>
      )}

      {mudarQuantidade && (
        <p className="mb-2 text-xs text-suave">
          Toque na quantidade (✎) para mudar ou remover a peça.
        </p>
      )}

      <ul className="divide-y divide-linha">
        {pedido.itens.map((item) => (
          <li key={item.produtoId} className="py-5 first:pt-2">
            <div className="mb-3 flex items-center gap-3">
              <FotoProduto src={item.foto} alt={item.nome} cores={item.cores} sizes="64px" className="h-20 w-16 shrink-0 rounded" />
              <div className="min-w-0">
                <h3 className="font-bold uppercase leading-tight">{item.nome}</h3>
                <p className="text-sm text-suave">
                  {item.referencia} · {formatarPreco(item.preco)}
                  {modo === "loja" && item.precoAtacado && item.precoAtacado !== item.preco && (
                    <> · atacado {formatarPreco(item.precoAtacado)}</>
                  )}
                </p>
              </div>
            </div>

            <ul className="grid gap-2">
              {Object.entries(item.grade).map(([cg, original]) => {
                const [cor, tamanho] = cg.split("|");
                const chave = chaveConferencia.item(item.produtoId, cor, tamanho);
                const corInfo = item.cores.find((c) => c.nome === cor);
                const q = quantidadeDaLinha(pedido, item.produtoId, cor, tamanho, original);
                const marca = conf[chave];
                const subsDaLinha = trocas.filter((s) => s.origem === chave);
                const titulo = `${cor} · ${tamanho}${item.legendaTamanhos?.[tamanho] ? ` (${item.legendaTamanhos[tamanho]})` : ""}`;
                const editar = mudarQuantidade && podeEditar(modo, marca) ? (n: number) => mudarQuantidade(chave, n) : undefined;

                if (q === 0) {
                  return (
                    <li key={chave}>
                      <LinhaRemovida
                        hex={corInfo?.hex ?? "#ccc"}
                        amostra={corInfo?.amostra}
                        titulo={titulo}
                        quantidadeOriginal={original}
                        quem={quemVende}
                        voltar={editar && (() => editar(original))}
                      />
                      {subsDaLinha.map(linhaSub)}
                    </li>
                  );
                }

                return (
                  <li key={chave}>
                    <Linha
                      hex={corInfo?.hex ?? "#ccc"}
                      amostra={corInfo?.amostra}
                      titulo={titulo}
                      quantidade={q}
                      quantidadeOriginal={original}
                      marca={marca}
                      marcar={marcar && ((e) => marcar(chave, e))}
                      editar={editar}
                    />
                    {subsDaLinha.map(linhaSub)}
                    {marca === "falta" && podeSubstituir && (modo !== "cliente" || quantidadeSemSubstituir(pedido, chave) > 0) && (
                      <BotaoCatalogo
                        rotulo="Substituir esta peça"
                        titulo={`Trocar ${item.nome} ${cor} ${tamanho}`}
                        quantidadeSugerida={modo === "cliente" ? quantidadeSemSubstituir(pedido, chave) : q}
                        quantidadeMaxima={modo === "cliente" ? quantidadeSemSubstituir(pedido, chave) : 999}
                        produtoInicial={item.produtoId}
                        margem={margem}
                        disponibilidade={disponibilidade}
                        onSalvar={(p, c, t, qtd) => substituir!(chave, p, c, t, qtd)}
                      />
                    )}
                    {marca === "falta" && modo === "cliente" && subsDaLinha.length === 0 && (
                      <p className="ml-11 mt-1 text-xs text-promo">
                        {podeSubstituir
                          ? "Em falta. Toque em Substituir esta peça para escolher outra no catálogo."
                          : "Em falta. A vendedora vai combinar uma troca com você."}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      {(acrescimos.length > 0 || acrescentar) && (
        <section className="border-t border-linha pt-4">
          {acrescimos.length > 0 && (
            <>
              <h3 className="font-bold">Peças acrescentadas</h3>
              <div className="mt-1 grid gap-1">{acrescimos.map(linhaSub)}</div>
            </>
          )}
          {acrescentar && (
            <button
              type="button"
              onClick={() => setAcrescentando(true)}
              className="mt-3 w-full rounded-md border-2 border-dashed border-violet-400 py-3 font-semibold text-violet-800"
            >
              + Acrescentar peça ao pedido
            </button>
          )}
          {acrescentando && acrescentar && (
            <EscolherDoCatalogo
              titulo="Acrescentar peça"
              quantidadeSugerida={1}
              quantidadeMaxima={999}
              margem={margem}
              disponibilidade={disponibilidade}
              onSalvar={acrescentar}
              onFechar={() => setAcrescentando(false)}
            />
          )}
        </section>
      )}

      {r.alterado && (
        <div className="mt-4 rounded-md border border-linha bg-creme px-4 py-3">
          <p className="font-semibold">Pedido após conferência</p>
          <div className="mt-1 flex justify-between text-sm">
            <span>{r.pecas} peças</span>
            <span className="font-bold">{formatarPreco(r.total)}</span>
          </div>
          {modo === "loja" && pedido.revendedora && (
            <p className="mt-1 text-right text-xs text-suave">No atacado: {formatarPreco(r.atacado)}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Loja desfaz qualquer troca; revendedora e cliente só as que a loja ainda não conferiu (a cliente, só as dela). */
function podeDesfazer(modo: Modo, sub: Substituicao, marca?: Conferencia) {
  if (modo === "loja") return true;
  if (marca) return false;
  return modo === "revendedora" || sub.por === "cliente";
}

/** Loja muda qualquer quantidade; a revendedora, só o que a loja ainda não separou. */
function podeEditar(modo: Modo, marca?: Conferencia) {
  if (modo === "loja") return true;
  return modo === "revendedora" && marca !== "ok";
}

const nomeQuemSubstituiu = { loja: "loja", revendedora: "revendedora", cliente: "cliente" } as const;

function Marca({ marca }: { marca?: Conferencia }) {
  if (marca === "ok")
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-sucesso text-white" title="Separado">
        ✓
      </span>
    );
  if (marca === "falta")
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-promo text-white" title="Em falta">
        ✕
      </span>
    );
  return <span className="size-7 rounded-full border-2 border-dashed border-linha" title="Aguardando conferência" />;
}

function BotoesMarca({ marca, marcar }: { marca?: Conferencia; marcar: (e: Conferencia | null) => Promise<void> }) {
  const [salvando, iniciar] = useTransition();
  const clicar = (e: Conferencia) => iniciar(() => marcar(marca === e ? null : e));
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        disabled={salvando}
        onClick={() => clicar("ok")}
        className={`size-9 rounded-full border-2 text-lg font-bold disabled:opacity-50 ${
          marca === "ok" ? "border-sucesso bg-sucesso text-white" : "border-sucesso text-sucesso"
        }`}
        aria-label="Marcar como separado"
        aria-pressed={marca === "ok"}
      >
        ✓
      </button>
      <button
        type="button"
        disabled={salvando}
        onClick={() => clicar("falta")}
        className={`size-9 rounded-full border-2 text-lg font-bold disabled:opacity-50 ${
          marca === "falta" ? "border-promo bg-promo text-white" : "border-promo text-promo"
        }`}
        aria-label="Marcar como em falta"
        aria-pressed={marca === "falta"}
      >
        ✕
      </button>
    </div>
  );
}

type LinhaProps = {
  hex: string;
  amostra?: string;
  titulo: string;
  quantidade: number;
  /** Quantidade que a cliente pediu, para mostrar quando a vendedora mudou */
  quantidadeOriginal?: number;
  marca?: Conferencia;
  marcar?: (e: Conferencia | null) => Promise<void>;
  editar?: (quantidade: number) => Resultado;
};

function Linha({ hex, amostra, titulo, quantidade, quantidadeOriginal, marca, marcar, editar }: LinhaProps) {
  const [editando, setEditando] = useState(false);
  const mudou = quantidadeOriginal !== undefined && quantidadeOriginal !== quantidade;
  return (
    <div>
      <div className={`flex items-center gap-3 rounded-md px-2 py-1.5 ${marca === "falta" ? "bg-red-50" : marca === "ok" ? "bg-green-50" : ""}`}>
        <BolinhaCor hex={hex} amostra={amostra} className="size-8" />
        <span className={`min-w-0 flex-1 text-sm ${marca === "falta" ? "text-suave line-through" : ""}`}>
          {titulo}
          {mudou && <span className="ml-1 text-xs text-suave no-underline">(pediu {quantidadeOriginal})</span>}
        </span>
        {editar ? (
          <button
            type="button"
            onClick={() => setEditando(!editando)}
            className="rounded-md border border-linha bg-white px-2 py-1 text-right font-semibold"
            aria-label="Mudar quantidade"
          >
            ×{quantidade} <span className="text-xs text-suave">✎</span>
          </button>
        ) : (
          <span className="w-10 text-right font-semibold">×{quantidade}</span>
        )}
        {marcar ? <BotoesMarca marca={marca} marcar={marcar} /> : <Marca marca={marca} />}
      </div>
      {editando && editar && <EditorQuantidade inicial={quantidade} salvar={editar} fechar={() => setEditando(false)} />}
    </div>
  );
}

function EditorQuantidade({ inicial, salvar, fechar }: { inicial: number; salvar: (q: number) => Resultado; fechar: () => void }) {
  const [q, setQ] = useState(inicial);
  const [salvando, iniciar] = useTransition();
  const [erro, setErro] = useState("");
  const enviar = (n: number) =>
    iniciar(async () => {
      const falha = await salvar(n);
      if (falha) return setErro(falha);
      fechar();
    });
  return (
    <div className="ml-11 mt-1 grid gap-2 rounded-md border border-linha bg-fundo p-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setQ(Math.max(1, q - 1))} className="size-9 rounded-md border border-linha bg-white text-lg">
          −
        </button>
        <input
          type="number"
          min={1}
          max={999}
          value={q}
          onChange={(e) => setQ(Math.min(999, Math.max(1, Number(e.target.value) || 1)))}
          className="w-16 rounded border border-linha bg-white px-2 py-1.5 text-center"
        />
        <button type="button" onClick={() => setQ(Math.min(999, q + 1))} className="size-9 rounded-md border border-linha bg-white text-lg">
          +
        </button>
        <button
          type="button"
          disabled={salvando || q === inicial}
          onClick={() => enviar(q)}
          className="rounded-md bg-texto px-3 py-2 font-semibold text-white disabled:opacity-40"
        >
          Salvar
        </button>
        <button type="button" onClick={fechar} className="px-2 text-suave underline">
          Cancelar
        </button>
      </div>
      <button
        type="button"
        disabled={salvando}
        onClick={() => enviar(0)}
        className="justify-self-start rounded-md border border-promo bg-white px-3 py-1.5 font-semibold text-promo disabled:opacity-50"
      >
        Remover do pedido
      </button>
      {erro && <p className="text-promo">{erro}</p>}
    </div>
  );
}

function LinhaRemovida({
  hex,
  amostra,
  titulo,
  quantidadeOriginal,
  quem,
  voltar,
}: {
  hex: string;
  amostra?: string;
  titulo: string;
  quantidadeOriginal: number;
  quem: string;
  voltar?: () => Resultado;
}) {
  const [salvando, iniciar] = useTransition();
  return (
    <div className="flex items-center gap-3 rounded-md bg-fundo px-2 py-1.5 opacity-70">
      <BolinhaCor hex={hex} amostra={amostra} className="size-8" />
      <span className="min-w-0 flex-1 text-sm">
        <span className="line-through">
          {titulo} ×{quantidadeOriginal}
        </span>
        <span className="ml-2 text-xs font-semibold text-suave">Removida pela {quem}</span>
      </span>
      {voltar && (
        <button
          type="button"
          disabled={salvando}
          onClick={() => iniciar(async () => void (await voltar()))}
          className="text-xs text-sky-800 underline disabled:opacity-50"
        >
          voltar
        </button>
      )}
    </div>
  );
}

function LinhaSubstituicao({
  sub,
  marca,
  marcar,
  remover,
  editar,
}: {
  sub: Substituicao;
  marca?: Conferencia;
  marcar?: (e: Conferencia | null) => Promise<void>;
  remover?: () => Promise<void>;
  editar?: (quantidade: number) => Resultado;
}) {
  const [removendo, iniciar] = useTransition();
  const acrescimo = ehAcrescimo(sub);
  return (
    <div className={acrescimo ? "border-l-2 border-violet-300 pl-3" : "ml-6 mt-1 border-l-2 border-sky-300 pl-3"}>
      <p className={`text-xs font-medium ${acrescimo ? "text-violet-800" : "text-sky-800"}`}>
        {acrescimo ? `+ Acrescentada (${nomeQuemSubstituiu[sub.por]}) · ${formatarPreco(sub.preco)}` : `↳ Substituído por (${nomeQuemSubstituiu[sub.por]}):`}
        {remover && (
          <button
            type="button"
            disabled={removendo}
            onClick={() => iniciar(remover)}
            className="ml-2 text-promo underline disabled:opacity-50"
          >
            desfazer
          </button>
        )}
      </p>
      <Linha
        hex={sub.hex}
        amostra={sub.amostra}
        titulo={`${sub.nome} · ${sub.cor} · ${sub.tamanho}`}
        quantidade={sub.quantidade}
        marca={marca}
        marcar={marcar}
        editar={editar}
      />
    </div>
  );
}

type EscolherProps = {
  titulo: string;
  quantidadeSugerida: number;
  quantidadeMaxima: number;
  /** Produto da peça em falta: aparece primeiro no catálogo */
  produtoInicial?: string;
  margem: number;
  disponibilidade?: Disponibilidade;
  onSalvar: (produtoId: string, cor: string, tamanho: string, quantidade: number) => Resultado;
};

/** Botão que abre o catálogo para escolher a peça da substituição. */
function BotaoCatalogo({ rotulo, ...props }: EscolherProps & { rotulo: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="ml-11 mt-1 rounded-md bg-sky-700 px-3 py-1.5 text-sm font-semibold text-white"
      >
        {rotulo}
      </button>
      {aberto && <EscolherDoCatalogo {...props} onFechar={() => setAberto(false)} />}
    </>
  );
}

/** Catálogo em tela cheia: a pessoa escolhe qualquer produto, depois a cor, o tamanho e a quantidade. */
function EscolherDoCatalogo({
  titulo,
  quantidadeSugerida,
  quantidadeMaxima,
  produtoInicial,
  margem,
  disponibilidade = {},
  onSalvar,
  onFechar,
}: EscolherProps & { onFechar: () => void }) {
  const lista = useMemo(() => {
    const ativos = aplicarDisponibilidade(produtos, disponibilidade).filter((p) => p.preco > 0);
    // Mesmo modelo primeiro, depois as novidades e os mais recentes
    return ativos.sort(
      (a, b) =>
        Number(b.id === produtoInicial) - Number(a.id === produtoInicial) ||
        Number(Boolean(b.novidade)) - Number(Boolean(a.novidade)) ||
        b.criadoEm.localeCompare(a.criadoEm),
    );
  }, [disponibilidade, produtoInicial]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [escolhido, setEscolhido] = useState<Produto | null>(null);

  // Trava a rolagem da página de trás enquanto o catálogo está aberto
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => void (document.body.style.overflow = antes);
  }, []);

  const termo = normalizar(busca);
  const visiveis = lista.filter(
    (p) =>
      (!categoria || (p.categorias as string[]).includes(categoria)) &&
      (!termo || normalizar(`${p.nome} ${p.referencia}`).includes(termo)),
  );
  const categoriasComProduto = categorias.filter((c) => lista.some((p) => (p.categorias as string[]).includes(c)));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="flex items-center gap-2 border-b border-linha px-4 py-3">
        {escolhido ? (
          <button type="button" onClick={() => setEscolhido(null)} className="text-sm font-semibold underline">
            ← Catálogo
          </button>
        ) : (
          <span className="font-bold">{titulo}</span>
        )}
        <button type="button" onClick={onFechar} className="ml-auto rounded-md border border-linha px-3 py-1.5 text-sm">
          Fechar ✕
        </button>
      </div>

      {escolhido ? (
        <DetalheEscolha
          key={escolhido.id}
          produto={escolhido}
          margem={margem}
          quantidadeSugerida={quantidadeSugerida}
          quantidadeMaxima={quantidadeMaxima}
          onSalvar={onSalvar}
          onPronto={onFechar}
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 grid gap-2 bg-white px-4 pb-2 pt-3">
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto ou referência"
              className="w-full rounded-md border border-linha px-3 py-2"
            />
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {[null, ...categoriasComProduto].map((c) => (
                <button
                  key={c ?? "todas"}
                  type="button"
                  onClick={() => setCategoria(c)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
                    categoria === c ? "border-texto bg-texto text-white" : "border-linha"
                  }`}
                >
                  {c ?? "Todas"}
                </button>
              ))}
            </div>
          </div>

          {visiveis.length === 0 ? (
            <p className="px-4 py-12 text-center text-suave">Nenhum produto encontrado.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 px-4 pb-8 sm:grid-cols-3">
              {visiveis.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => setEscolhido(p)} className="block w-full text-left">
                    <FotoProduto src={p.fotos[0]} alt={p.nome} cores={p.cores} sizes="(min-width: 640px) 30vw, 45vw" className="aspect-[3/4] w-full rounded" />
                    {p.id === produtoInicial && (
                      <span className="mt-1 inline-block rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-semibold text-sky-800">
                        Mesmo modelo, outras cores
                      </span>
                    )}
                    <span className="mt-1 block text-sm font-semibold uppercase leading-tight">{p.nome}</span>
                    <span className="block text-sm">
                      {p.precosTamanho ? "a partir de " : ""}
                      {formatarPreco(precoComMargem(Math.min(p.preco, ...Object.values(p.precosTamanho ?? {})), margem))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function DetalheEscolha({
  produto,
  margem,
  quantidadeSugerida,
  quantidadeMaxima,
  onSalvar,
  onPronto,
}: {
  produto: Produto;
  margem: number;
  quantidadeSugerida: number;
  quantidadeMaxima: number;
  onSalvar: EscolherProps["onSalvar"];
  onPronto: () => void;
}) {
  const [cor, setCor] = useState(produto.cores.length === 1 ? produto.cores[0].nome : "");
  const [tamanho, setTamanho] = useState(produto.tamanhos.length === 1 ? produto.tamanhos[0] : "");
  const [quantidade, setQuantidade] = useState(quantidadeSugerida);
  const [salvando, iniciar] = useTransition();
  const [erro, setErro] = useState("");
  const foto = produto.cores.find((c) => c.nome === cor)?.foto ?? produto.fotos[0];
  const preco = precoComMargem(tamanho ? precoDoTamanho(produto, tamanho) : produto.preco, margem);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto grid max-w-xl gap-4 px-4 pb-10 pt-4">
        <FotoProduto src={foto} alt={produto.nome} cores={produto.cores} sizes="(min-width: 640px) 576px, 100vw" className="aspect-[3/4] w-full rounded" />
        <div>
          <h2 className="font-bold uppercase">{produto.nome}</h2>
          <p className="text-sm text-suave">
            {produto.referencia} · {formatarPreco(preco)}
          </p>
        </div>

        <div className="text-sm">
          Cor
          <div className="mt-1 flex flex-wrap gap-2">
            {produto.cores.map((c) => (
              <button
                key={c.nome}
                type="button"
                onClick={() => {
                  setCor(c.nome);
                  if (produto.esgotados?.includes(`${c.nome}|${tamanho}`)) setTamanho("");
                }}
                className={`flex items-center gap-1.5 rounded-full border bg-white py-1 pl-1 pr-2.5 text-xs ${
                  cor === c.nome ? "border-sky-700 ring-2 ring-sky-700" : "border-linha"
                }`}
              >
                <BolinhaCor hex={c.hex} amostra={c.amostra} className="size-6" />
                {c.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm">
          Tamanho
          <div className="mt-1 flex flex-wrap gap-2">
            {produto.tamanhos.map((t) => {
              const esgotado = Boolean(cor) && Boolean(produto.esgotados?.includes(`${cor}|${t}`));
              return (
                <button
                  key={t}
                  type="button"
                  disabled={esgotado}
                  onClick={() => setTamanho(t)}
                  className={`min-w-11 rounded-md border bg-white px-3 py-1.5 disabled:opacity-40 disabled:line-through ${
                    tamanho === t ? "border-sky-700 ring-2 ring-sky-700" : "border-linha"
                  }`}
                >
                  {t}
                  {produto.legendaTamanhos?.[t] && <span className="block text-[10px] text-suave">{produto.legendaTamanhos[t]}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          Quantidade
          <input
            type="number"
            min={1}
            max={quantidadeMaxima}
            value={quantidade}
            onChange={(e) => setQuantidade(Math.min(quantidadeMaxima, Math.max(1, Number(e.target.value) || 1)))}
            className="w-20 rounded border border-linha bg-white px-2 py-1.5 text-center"
          />
          {quantidadeMaxima < 999 && <span className="text-xs text-suave">até {quantidadeMaxima}</span>}
        </label>

        {erro && <p className="text-sm text-promo">{erro}</p>}

        <button
          type="button"
          disabled={salvando}
          onClick={() => {
            if (!cor || !tamanho) return setErro("Escolha a cor e o tamanho.");
            setErro("");
            iniciar(async () => {
              const falha = await onSalvar(produto.id, cor, tamanho, quantidade);
              if (falha) return setErro(falha);
              onPronto();
            });
          }}
          className="rounded-md bg-sky-700 py-3 font-semibold text-white disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Confirmar"}
        </button>
      </div>
    </div>
  );
}

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
