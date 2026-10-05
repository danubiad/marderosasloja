"use client";

import { useState, useTransition } from "react";
import { BolinhaCor } from "@/components/BolinhaCor";
import { FotoProduto } from "@/components/FotoProduto";
import { produtos } from "@/data/produtos";
import { formatarPreco } from "@/lib/format";
import { chaveConferencia, resumoConferencia, type Conferencia, type Pedido, type Substituicao } from "@/lib/tipos-pedido";

type Modo = "cliente" | "loja" | "revendedora";

type Props = {
  pedido: Pedido;
  modo: Modo;
  marcar?: (chave: string, estado: Conferencia | null) => Promise<void>;
  substituir?: (origem: string, produtoId: string, cor: string, tamanho: string, quantidade: number) => Promise<void>;
  removerSubstituicao?: (subId: string) => Promise<void>;
};

export function ConferenciaPedido({ pedido, modo, marcar, substituir, removerSubstituicao }: Props) {
  const conf = pedido.conferencia ?? {};
  const subs = pedido.substituicoes ?? [];
  const r = resumoConferencia(pedido);
  const podeSubstituir = Boolean(substituir) && (modo === "loja" || modo === "revendedora");

  return (
    <div>
      {modo !== "cliente" && (
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-fundo px-3 py-1">
            Conferidos: {r.conferidos} de {r.totalLinhas}
          </span>
          {r.faltas > 0 && <span className="rounded-full bg-red-50 px-3 py-1 text-promo">{r.faltas} peça(s) em falta</span>}
          {subs.length > 0 && <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-800">{subs.length} substituição(ões)</span>}
        </div>
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
              {Object.entries(item.grade).map(([cg, q]) => {
                const [cor, tamanho] = cg.split("|");
                const chave = chaveConferencia.item(item.produtoId, cor, tamanho);
                const corInfo = item.cores.find((c) => c.nome === cor);
                const marca = conf[chave];
                const subsDaLinha = subs.filter((s) => s.origem === chave);
                return (
                  <li key={chave}>
                    <Linha
                      hex={corInfo?.hex ?? "#ccc"}
                      amostra={corInfo?.amostra}
                      titulo={`${cor} · ${tamanho}${item.legendaTamanhos?.[tamanho] ? ` (${item.legendaTamanhos[tamanho]})` : ""}`}
                      quantidade={q}
                      marca={marca}
                      marcar={marcar && ((e) => marcar(chave, e))}
                    />
                    {subsDaLinha.map((s) => (
                      <LinhaSubstituicao
                        key={s.id}
                        sub={s}
                        marca={conf[chaveConferencia.substituicao(s.id)]}
                        marcar={marcar && ((e) => marcar(chaveConferencia.substituicao(s.id), e))}
                        remover={
                          removerSubstituicao &&
                          (modo === "loja" || (modo === "revendedora" && !conf[chaveConferencia.substituicao(s.id)]))
                            ? () => removerSubstituicao(s.id)
                            : undefined
                        }
                      />
                    ))}
                    {marca === "falta" && podeSubstituir && (
                      <FormSubstituicao
                        quantidadeSugerida={q}
                        produtoInicial={item.produtoId}
                        onSalvar={(p, c, t, qtd) => substituir!(chave, p, c, t, qtd)}
                      />
                    )}
                    {marca === "falta" && modo === "cliente" && subsDaLinha.length === 0 && (
                      <p className="ml-11 mt-1 text-xs text-promo">Em falta. A vendedora vai combinar uma troca com você.</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

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
  marca?: Conferencia;
  marcar?: (e: Conferencia | null) => Promise<void>;
};

function Linha({ hex, amostra, titulo, quantidade, marca, marcar }: LinhaProps) {
  return (
    <div className={`flex items-center gap-3 rounded-md px-2 py-1.5 ${marca === "falta" ? "bg-red-50" : marca === "ok" ? "bg-green-50" : ""}`}>
      <BolinhaCor hex={hex} amostra={amostra} className="size-8" />
      <span className={`min-w-0 flex-1 text-sm ${marca === "falta" ? "text-suave line-through" : ""}`}>{titulo}</span>
      <span className="w-10 text-right font-semibold">×{quantidade}</span>
      {marcar ? <BotoesMarca marca={marca} marcar={marcar} /> : <Marca marca={marca} />}
    </div>
  );
}

function LinhaSubstituicao({
  sub,
  marca,
  marcar,
  remover,
}: {
  sub: Substituicao;
  marca?: Conferencia;
  marcar?: (e: Conferencia | null) => Promise<void>;
  remover?: () => Promise<void>;
}) {
  const [removendo, iniciar] = useTransition();
  return (
    <div className="ml-6 mt-1 border-l-2 border-sky-300 pl-3">
      <p className="text-xs font-medium text-sky-800">
        ↳ Substituído por ({sub.por === "loja" ? "loja" : "revendedora"}):
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
      />
    </div>
  );
}

function FormSubstituicao({
  quantidadeSugerida,
  produtoInicial,
  onSalvar,
}: {
  quantidadeSugerida: number;
  produtoInicial: string;
  onSalvar: (produtoId: string, cor: string, tamanho: string, quantidade: number) => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const [produtoId, setProdutoId] = useState(produtoInicial);
  const produto = produtos.find((p) => p.id === produtoId)!;
  const [cor, setCor] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [quantidade, setQuantidade] = useState(quantidadeSugerida);
  const [salvando, iniciar] = useTransition();
  const [erro, setErro] = useState("");

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="ml-11 mt-1 rounded-md bg-sky-700 px-3 py-1.5 text-sm font-semibold text-white"
      >
        Substituir esta peça
      </button>
    );
  }

  return (
    <div className="ml-6 mt-2 grid gap-3 rounded-md border border-sky-200 bg-sky-50 p-3">
      <label className="grid gap-1 text-sm">
        Produto
        <select
          value={produtoId}
          onChange={(e) => {
            setProdutoId(e.target.value);
            setCor("");
            setTamanho("");
          }}
          className="rounded border border-linha bg-white px-2 py-2"
        >
          {produtos
            .filter((p) => p.preco > 0)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
        </select>
      </label>

      <div className="text-sm">
        Cor
        <div className="mt-1 flex flex-wrap gap-2">
          {produto.cores.map((c) => (
            <button
              key={c.nome}
              type="button"
              onClick={() => setCor(c.nome)}
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
          {produto.tamanhos.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTamanho(t)}
              className={`min-w-11 rounded-md border bg-white px-3 py-1.5 ${tamanho === t ? "border-sky-700 ring-2 ring-sky-700" : "border-linha"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        Quantidade
        <input
          type="number"
          min={1}
          max={999}
          value={quantidade}
          onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 rounded border border-linha bg-white px-2 py-1.5 text-center"
        />
      </label>

      {erro && <p className="text-sm text-promo">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={salvando}
          onClick={() => {
            if (!cor || !tamanho) return setErro("Escolha a cor e o tamanho.");
            setErro("");
            iniciar(async () => {
              await onSalvar(produtoId, cor, tamanho, quantidade);
              setAberto(false);
            });
          }}
          className="flex-1 rounded-md bg-sky-700 py-2 font-semibold text-white disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Confirmar substituição"}
        </button>
        <button type="button" onClick={() => setAberto(false)} className="rounded-md border border-linha bg-white px-4">
          Cancelar
        </button>
      </div>
    </div>
  );
}
