"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarraTotal } from "@/components/BarraTotal";
import { Cabecalho } from "@/components/Cabecalho";
import { Resumo } from "@/components/Resumo";
import { calcularResumo, entregasDisponiveis } from "@/lib/calculo";
import { CHAVE_CLIENTE, useCarrinho } from "@/lib/carrinho";
import { atingiuMinimo } from "@/lib/config";
import {
  documentoValido,
  formatarCep,
  formatarDocumento,
  formatarPreco,
  formatarTelefone,
  somenteDigitos,
} from "@/lib/format";
import { useLoja } from "@/lib/loja";
import { rastrear } from "@/lib/pixel";

type Etapa = "identificacao" | "endereco" | "entrega";

type Dados = {
  nome: string;
  documento: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

const vazio: Dados = {
  nome: "",
  documento: "",
  telefone: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

const CHAVE_DADOS = CHAVE_CLIENTE;

const campo = "w-full rounded-md border border-linha px-4 py-3.5 text-lg outline-none focus:border-dourado";

export function TelaFinalizar() {
  const router = useRouter();
  const { base, revendedora } = useLoja();
  const formasEntrega = entregasDisponiveis(Boolean(revendedora));
  const { itens, carregado, cupom, observacao, limpar } = useCarrinho();
  const [etapa, setEtapa] = useState<Etapa>("identificacao");
  const [dados, setDados] = useState<Dados>(vazio);
  const [entregaId, setEntregaId] = useState(formasEntrega[0]?.id ?? "");
  const [erro, setErro] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const resumo = calcularResumo(itens, {
    codigoCupom: cupom,
    entregaId,
    revendedora: revendedora ? { margem: revendedora.margem } : undefined,
  });
  const liberado = revendedora ? true : atingiuMinimo(resumo.subtotal, resumo.pecas);

  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE_DADOS) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- preenche com os dados da última compra
      if (salvo) setDados({ ...vazio, ...salvo });
    } catch {}
  }, []);

  useEffect(() => {
    if (carregado && (resumo.linhas.length === 0 || !liberado) && !enviando) {
      router.replace(`${base}/carrinho`);
    }
  }, [carregado, resumo.linhas.length, liberado, enviando, router, base]);

  function atualizar(campo: keyof Dados, valor: string) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  async function buscarCep(cep: string) {
    const digitos = somenteDigitos(cep);
    if (digitos.length !== 8) return;
    setBuscandoCep(true);
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const r = await resposta.json();
      if (!r.erro) {
        setDados((d) => ({
          ...d,
          logradouro: r.logradouro || d.logradouro,
          bairro: r.bairro || d.bairro,
          cidade: r.localidade || d.cidade,
          uf: r.uf || d.uf,
        }));
      }
    } catch {
    } finally {
      setBuscandoCep(false);
    }
  }

  function avancar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (etapa === "identificacao") {
      const temDocumento = somenteDigitos(dados.documento).length > 0;
      if ((!revendedora || temDocumento) && !documentoValido(dados.documento)) return setErro("CPF ou CNPJ inválido.");
      if (dados.nome.trim().length < 3) return setErro("Informe seu nome completo.");
      if (somenteDigitos(dados.telefone).length < 10) return setErro("Informe um WhatsApp com DDD.");
      setEtapa("endereco");
    } else if (etapa === "endereco") {
      if (somenteDigitos(dados.cep).length !== 8) return setErro("CEP inválido.");
      if (!dados.logradouro || !dados.numero || !dados.bairro || !dados.cidade || !dados.uf)
        return setErro("Preencha todos os campos obrigatórios.");
      try {
        localStorage.setItem(CHAVE_DADOS, JSON.stringify(dados));
      } catch {}
      setEtapa("entrega");
    } else {
      finalizar();
    }
    window.scrollTo({ top: 0 });
  }

  async function finalizar() {
    setEnviando(true);
    try {
      const resposta = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens, cupom, observacao, entregaId, cliente: dados, revendedora: revendedora?.usuario }),
      });
      const r = await resposta.json();
      if (!resposta.ok) throw new Error(r.erro ?? "Não foi possível enviar o pedido.");
      // A compra (Purchase) só é enviada ao Meta quando a loja confirma a venda no painel
      rastrear("InitiateCheckout", {
        value: resumo.total,
        currency: "BRL",
        num_items: resumo.pecas,
        content_type: "product",
        content_ids: resumo.linhas.map((l) => l.produto.referencia),
      });
      router.push(`/pedido/${r.id}?enviado=1`);
      limpar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar o pedido.");
      setEnviando(false);
    }
  }

  function voltar() {
    setErro("");
    if (etapa === "entrega") setEtapa("endereco");
    else if (etapa === "endereco") setEtapa("identificacao");
    else router.back();
  }

  const titulos: Record<Etapa, string> = {
    identificacao: "Identificação",
    endereco: "Endereço de entrega",
    entrega: "Forma de entrega",
  };

  if (!carregado) return null;

  return (
    <>
      <Cabecalho voltar titulo={titulos[etapa]} semCarrinho />

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-40 pt-6">
        <ol className="mb-6 flex gap-2" aria-label="Etapas">
          {(Object.keys(titulos) as Etapa[]).map((e, i) => (
            <li
              key={e}
              className={`h-1.5 flex-1 rounded-full ${
                i <= Object.keys(titulos).indexOf(etapa) ? "bg-dourado-escuro" : "bg-linha"
              }`}
            />
          ))}
        </ol>

        {etapa !== "identificacao" && (
          <button type="button" onClick={voltar} className="mb-4 text-sm text-suave underline">
            ← Etapa anterior
          </button>
        )}

        <form id="form-finalizar" onSubmit={avancar} noValidate className="grid gap-4">
          {etapa === "identificacao" && (
            <>
              <p className="text-center text-lg font-bold text-dourado-escuro">
                Para continuar seu pedido, informe seus dados:
              </p>
              <input
                className={campo}
                inputMode="numeric"
                placeholder={revendedora ? "CPF (opcional)" : "CNPJ ou CPF"}
                value={dados.documento}
                onChange={(e) => atualizar("documento", formatarDocumento(e.target.value))}
                autoFocus
              />
              <input
                className={campo}
                placeholder="Nome completo"
                autoComplete="name"
                value={dados.nome}
                onChange={(e) => atualizar("nome", e.target.value)}
              />
              <input
                className={campo}
                inputMode="tel"
                placeholder="WhatsApp com DDD"
                autoComplete="tel"
                value={dados.telefone}
                onChange={(e) => atualizar("telefone", formatarTelefone(e.target.value))}
              />
            </>
          )}

          {etapa === "endereco" && (
            <>
              <div className="flex items-center gap-4">
                <input
                  className={`${campo} flex-1`}
                  inputMode="numeric"
                  placeholder="CEP*"
                  autoComplete="postal-code"
                  value={dados.cep}
                  onChange={(e) => {
                    const cep = formatarCep(e.target.value);
                    atualizar("cep", cep);
                    buscarCep(cep);
                  }}
                  autoFocus
                />
                <a
                  href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center text-sky-600 underline"
                >
                  {buscandoCep ? "Buscando..." : "Não sei meu CEP"}
                </a>
              </div>
              <input className={campo} placeholder="Endereço*" value={dados.logradouro} onChange={(e) => atualizar("logradouro", e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <input className={campo} placeholder="Número*" value={dados.numero} onChange={(e) => atualizar("numero", e.target.value)} />
                <input className={campo} placeholder="Complemento" value={dados.complemento} onChange={(e) => atualizar("complemento", e.target.value)} />
              </div>
              <input className={campo} placeholder="Bairro*" value={dados.bairro} onChange={(e) => atualizar("bairro", e.target.value)} />
              <div className="grid grid-cols-[1fr_2fr] gap-4">
                <input
                  className={campo}
                  placeholder="UF*"
                  maxLength={2}
                  value={dados.uf}
                  onChange={(e) => atualizar("uf", e.target.value.toUpperCase())}
                />
                <input className={campo} placeholder="Cidade*" value={dados.cidade} onChange={(e) => atualizar("cidade", e.target.value)} />
              </div>
            </>
          )}

          {etapa === "entrega" && (
            <>
              <button
                type="button"
                onClick={() => setEtapa("endereco")}
                className="rounded-md border-2 border-sucesso px-4 py-3 text-left"
              >
                <span className="block font-semibold">{dados.nome}</span>
                <span className="block text-suave">
                  {dados.logradouro}, {dados.numero}
                  {dados.complemento && ` — ${dados.complemento}`} · {dados.bairro}
                </span>
                <span className="block text-suave">
                  {dados.cidade}/{dados.uf} | CEP {dados.cep}
                </span>
                <span className="mt-1 block text-sm text-sky-600 underline">Editar</span>
              </button>

              <h2 className="mt-2 text-xl font-semibold">Opções de entrega</h2>
              <div className="grid gap-2">
                {formasEntrega.map((f) => (
                  <label key={f.id} className="flex cursor-pointer gap-4 rounded-md px-2 py-4 hover:bg-creme">
                    <input
                      type="radio"
                      name="entrega"
                      value={f.id}
                      checked={entregaId === f.id}
                      onChange={() => setEntregaId(f.id)}
                      className="mt-1 size-6 shrink-0 accent-sucesso"
                    />
                    <span className="flex-1">
                      <span className="flex justify-between gap-4 font-bold uppercase">
                        {f.titulo}
                        {f.valor > 0 && <span className="whitespace-nowrap">{formatarPreco(f.valor)}</span>}
                      </span>
                      {f.descricao.map((linha) => (
                        <span key={linha} className="mt-1 block text-sm text-suave">
                          {linha}
                        </span>
                      ))}
                    </span>
                  </label>
                ))}
              </div>

              <Resumo
                pecas={resumo.pecas}
                subtotal={resumo.subtotal}
                desconto={resumo.desconto}
                cupom={resumo.cupom?.codigo}
                entrega={resumo.entrega}
                total={resumo.total}
              />
            </>
          )}

          {erro && (
            <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-center text-promo">
              {erro}
            </p>
          )}
        </form>
      </main>

      <BarraTotal
        total={resumo.total}
        rotulo={etapa === "entrega" ? "Finalizar compra" : "Continuar"}
        type="submit"
        form="form-finalizar"
        carregando={enviando}
      />
    </>
  );
}
