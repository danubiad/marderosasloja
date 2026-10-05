import "server-only";
import type { Itens } from "@/lib/calculo";
import { kv } from "@/lib/kv";
import type { Pedido } from "@/lib/tipos-pedido";

export type CarrinhoSalvo = {
  id: string;
  telefone: string;
  nome: string;
  /** Usuário da revendedora, se o carrinho é do catálogo dela */
  revendedora?: string;
  itens: Itens;
  pecas: number;
  valor: number;
  /** Resumo legível: "Baby Doll Bolsinho (6)" */
  resumo: string[];
  criadoEm: string;
  /** Última mudança nos itens */
  atualizadoEm: string;
  /** Última vez que a cliente esteve no site */
  vistoEm: string;
  pedidoId?: string;
  pedidoNumero?: number;
  finalizadoEm?: string;
};

export type Cliente = {
  id: string;
  telefone: string;
  nome: string;
  documento?: string;
  cidade?: string;
  uf?: string;
  revendedora?: string;
  primeiroAcesso: string;
  ultimoAcesso: string;
  pedidos: string[];
  totalGasto: number;
  ultimoPedidoEm?: string;
};

/** Mesma cliente em catálogos diferentes (loja x revendedora) vira registros separados. */
function idDe(telefone: string, revendedora?: string) {
  return revendedora ? `${telefone}@${revendedora}` : telefone;
}

type Atividade = {
  telefone: string;
  nome: string;
  revendedora?: string;
  itens: Itens;
  pecas: number;
  valor: number;
  resumo: string[];
};

/** Registra a cliente no site e salva o carrinho dela. */
export async function registrarAtividade(a: Atividade) {
  const agora = new Date().toISOString();
  const id = idDe(a.telefone, a.revendedora);

  const atual = await kv.get<CarrinhoSalvo>(`carrinho:${id}`);
  const temItens = a.pecas > 0;
  const mudou = JSON.stringify(atual?.itens ?? {}) !== JSON.stringify(a.itens);
  let carrinho: CarrinhoSalvo;

  if (!atual) {
    carrinho = { id, ...a, criadoEm: agora, atualizadoEm: agora, vistoEm: agora };
  } else if (atual.pedidoId && !temItens) {
    // Pedido já fechado e carrinho vazio: só registra a visita
    carrinho = { ...atual, nome: a.nome || atual.nome, vistoEm: agora };
  } else {
    const novoCiclo = Boolean(atual.pedidoId) && temItens;
    carrinho = {
      ...atual,
      ...a,
      nome: a.nome || atual.nome,
      criadoEm: novoCiclo ? agora : atual.criadoEm,
      atualizadoEm: mudou ? agora : atual.atualizadoEm,
      vistoEm: agora,
      ...(novoCiclo ? { pedidoId: undefined, pedidoNumero: undefined, finalizadoEm: undefined } : {}),
    };
  }
  await kv.set(`carrinho:${id}`, carrinho);
  await kv.sadd("carrinhos", id);

  const cliente = await kv.get<Cliente>(`cliente:${id}`);
  await kv.set(`cliente:${id}`, {
    id,
    telefone: a.telefone,
    revendedora: a.revendedora,
    pedidos: [],
    totalGasto: 0,
    primeiroAcesso: agora,
    ...cliente,
    nome: a.nome || cliente?.nome || "",
    ultimoAcesso: agora,
  } satisfies Cliente);
  await kv.sadd("clientes", id);
}

/** Atualiza a ficha da cliente e fecha o carrinho quando um pedido é feito. */
export async function registrarPedidoDaCliente(p: Pedido) {
  const id = idDe(p.cliente.telefone, p.revendedora?.usuario);
  const agora = p.criadoEm;
  const cliente = await kv.get<Cliente>(`cliente:${id}`);
  await kv.set(`cliente:${id}`, {
    id,
    telefone: p.cliente.telefone,
    revendedora: p.revendedora?.usuario,
    primeiroAcesso: cliente?.primeiroAcesso ?? agora,
    ...cliente,
    nome: p.cliente.nome,
    documento: p.cliente.documento || cliente?.documento,
    cidade: p.endereco.cidade,
    uf: p.endereco.uf,
    ultimoAcesso: agora,
    pedidos: [p.id, ...(cliente?.pedidos ?? [])],
    totalGasto: (cliente?.totalGasto ?? 0) + p.total,
    ultimoPedidoEm: agora,
  } satisfies Cliente);
  await kv.sadd("clientes", id);

  const carrinho = await kv.get<CarrinhoSalvo>(`carrinho:${id}`);
  await kv.set(`carrinho:${id}`, {
    id,
    telefone: p.cliente.telefone,
    nome: p.cliente.nome,
    revendedora: p.revendedora?.usuario,
    criadoEm: carrinho?.criadoEm ?? agora,
    itens: {},
    pecas: p.pecas,
    valor: p.total,
    resumo: p.itens.map((i) => `${i.nome} (${i.pecas})`),
    atualizadoEm: agora,
    vistoEm: agora,
    pedidoId: p.id,
    pedidoNumero: p.numero,
    finalizadoEm: agora,
  } satisfies CarrinhoSalvo);
  await kv.sadd("carrinhos", id);
}

export async function listarCarrinhos() {
  const ids = await kv.smembers("carrinhos");
  const lista = await kv.mget<CarrinhoSalvo>(ids.map((id) => `carrinho:${id}`));
  return lista.filter((c): c is CarrinhoSalvo => c !== null).sort((a, b) => b.vistoEm.localeCompare(a.vistoEm));
}

export async function listarClientes() {
  const ids = await kv.smembers("clientes");
  const lista = await kv.mget<Cliente>(ids.map((id) => `cliente:${id}`));
  return lista.filter((c): c is Cliente => c !== null).sort((a, b) => b.ultimoAcesso.localeCompare(a.ultimoAcesso));
}

export type SituacaoCarrinho = "navegando" | "parado" | "abandonado" | "finalizado" | "vazio";

/** Situação real do carrinho a partir das datas. */
export function situacaoCarrinho(c: CarrinhoSalvo, agora = Date.now()): SituacaoCarrinho {
  if (c.pedidoId && c.pecas >= 0 && Object.keys(c.itens).length === 0) return "finalizado";
  if (c.pecas === 0) return "vazio";
  const minutosVisto = (agora - Date.parse(c.vistoEm)) / 60000;
  if (minutosVisto <= 3) return "navegando";
  if (minutosVisto <= 60) return "parado";
  return "abandonado";
}
