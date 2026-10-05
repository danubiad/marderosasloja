"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BolinhaCor } from "@/components/BolinhaCor";
import { FotoProduto } from "@/components/FotoProduto";
import { IconeBusca, IconeSeta } from "@/components/icones";
import type { Categoria, Produto } from "@/data/produtos";
import { formatarPreco } from "@/lib/format";

type Ordem = "recentes" | "menor" | "maior" | "nome";

const ordens: { id: Ordem; nome: string }[] = [
  { id: "recentes", nome: "Mais recentes" },
  { id: "menor", nome: "Menor preço" },
  { id: "maior", nome: "Maior preço" },
  { id: "nome", nome: "Nome A-Z" },
];

type Props = { produtos: Produto[]; categorias: readonly Categoria[] };

export function Vitrine({ produtos, categorias }: Props) {
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [ordem, setOrdem] = useState<Ordem>("recentes");
  const [novidades, setNovidades] = useState(false);
  const [promocoes, setPromocoes] = useState(false);
  const [busca, setBusca] = useState("");
  const [menu, setMenu] = useState<"categorias" | "preco" | null>(null);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = produtos.filter(
      (p) =>
        (!categoria || p.categorias.includes(categoria)) &&
        (!novidades || p.novidade) &&
        (!promocoes || p.precoDe) &&
        (!termo || `${p.nome} ${p.referencia}`.toLowerCase().includes(termo)),
    );
    return filtrados.sort((a, b) => {
      if (ordem === "menor") return a.preco - b.preco;
      if (ordem === "maior") return b.preco - a.preco;
      if (ordem === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
      return b.criadoEm.localeCompare(a.criadoEm);
    });
  }, [produtos, categoria, ordem, novidades, promocoes, busca]);

  const chip = (ativo: boolean) =>
    `flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-sm transition ${
      ativo ? "bg-texto text-white" : "bg-fundo text-texto hover:bg-linha"
    }`;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="px-4 pt-4">
        <label className="flex items-center gap-2 rounded-md border border-linha px-3 focus-within:border-dourado">
          <IconeBusca className="size-5 text-suave" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou referência"
            className="w-full bg-transparent py-2.5 outline-none"
          />
        </label>
      </div>

      <div className="relative">
        <div className="flex gap-3 overflow-x-auto px-4 py-4 [scrollbar-width:none]">
          <button type="button" className={chip(Boolean(categoria))} onClick={() => setMenu(menu === "categorias" ? null : "categorias")}>
            {categoria ?? "Categorias"} <IconeSeta />
          </button>
          <button type="button" className={chip(novidades)} onClick={() => setNovidades((v) => !v)} aria-pressed={novidades}>
            Novidades
          </button>
          <button type="button" className={chip(ordem !== "recentes")} onClick={() => setMenu(menu === "preco" ? null : "preco")}>
            {ordem === "recentes" ? "Preço" : ordens.find((o) => o.id === ordem)?.nome} <IconeSeta />
          </button>
          <button type="button" className={chip(promocoes)} onClick={() => setPromocoes((v) => !v)} aria-pressed={promocoes}>
            Promoções
          </button>
        </div>

        {menu && (
          <>
            <button type="button" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenu(null)} aria-label="Fechar" />
            <div className="absolute left-4 right-4 top-full z-20 -mt-2 rounded-md border border-linha bg-white py-1 shadow-lg sm:right-auto sm:w-64">
              {menu === "categorias"
                ? [null, ...categorias].map((c) => (
                    <button
                      key={c ?? "todas"}
                      type="button"
                      onClick={() => {
                        setCategoria(c);
                        setMenu(null);
                      }}
                      className={`block w-full px-4 py-2.5 text-left hover:bg-fundo ${categoria === c ? "font-semibold text-dourado-escuro" : ""}`}
                    >
                      {c ?? "Todas as categorias"}
                    </button>
                  ))
                : ordens.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setOrdem(o.id);
                        setMenu(null);
                      }}
                      className={`block w-full px-4 py-2.5 text-left hover:bg-fundo ${ordem === o.id ? "font-semibold text-dourado-escuro" : ""}`}
                    >
                      {o.nome}
                    </button>
                  ))}
            </div>
          </>
        )}
      </div>

      {lista.length === 0 ? (
        <p className="px-4 py-16 text-center text-suave">
          {categoria && !busca && !novidades && !promocoes
            ? `Em breve novidades em ${categoria}.`
            : "Nenhum produto encontrado."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 px-3 pb-10 md:grid-cols-3 lg:grid-cols-4">
          {lista.map((p, i) => (
            <li key={p.id}>
              <Link href={`/produto/${p.slug}`} className="group block text-center">
                <div className="relative">
                  <FotoProduto
                    src={p.fotos[0]}
                    alt={p.nome}
                    cores={p.cores}
                    priority={i < 4}
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="aspect-[4/5] w-full transition group-hover:opacity-90"
                  />
                  {p.precoDe && (
                    <span className="absolute left-2 top-2 rounded bg-promo px-2 py-0.5 text-xs font-bold text-white">
                      -{Math.round((1 - p.preco / p.precoDe) * 100)}%
                    </span>
                  )}
                  {p.novidade && (
                    <span className="absolute right-2 top-2 rounded bg-white/90 px-2 py-0.5 text-xs font-semibold text-dourado-escuro">
                      Novo
                    </span>
                  )}
                </div>
                <h2 className="mt-3 truncate px-1 uppercase">{p.nome}</h2>
                {p.preco > 0 ? (
                  <p className="font-bold">
                    {p.precoDe && <span className="mr-2 text-sm font-normal text-suave line-through">{formatarPreco(p.precoDe)}</span>}
                    {formatarPreco(p.preco)}
                  </p>
                ) : (
                  <p className="text-sm text-suave">Preço em breve</p>
                )}
                {p.cores.length > 1 && (
                  <div className="mt-2 flex justify-center gap-2">
                    {p.cores.slice(0, 5).map((c) => (
                      <BolinhaCor key={c.nome} hex={c.hex} amostra={c.amostra} className="size-5" />
                    ))}
                    {p.cores.length > 5 && <span className="text-xs leading-5 text-suave">+{p.cores.length - 5}</span>}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
