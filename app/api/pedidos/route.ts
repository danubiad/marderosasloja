import { randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { calcularResumo, type Itens } from "@/lib/calculo";
import { registrarPedidoDaCliente } from "@/lib/clientes";
import { atingiuMinimo } from "@/lib/config";
import { documentoValido, somenteDigitos } from "@/lib/format";
import { proximoNumero, salvarPedido, type Pedido } from "@/lib/pedidos";
import { buscarRevendedoraAtiva } from "@/lib/revendedoras";

const texto = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Cookies do Pixel e dados do navegador, usados depois para enviar a venda confirmada ao Meta. */
async function dadosMeta(): Promise<Pedido["meta"]> {
  const c = await cookies();
  const h = await headers();
  return {
    fbp: c.get("_fbp")?.value,
    fbc: c.get("_fbc")?.value,
    ip: h.get("x-forwarded-for")?.split(",")[0].trim() || undefined,
    navegador: h.get("user-agent")?.slice(0, 400) || undefined,
    url: h.get("referer") || undefined,
  };
}

export async function POST(request: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ erro: "Pedido inválido." }, { status: 400 });
  }

  // Pedido feito no catálogo de uma revendedora
  let revendedora: Awaited<ReturnType<typeof buscarRevendedoraAtiva>> = null;
  if (typeof corpo.revendedora === "string" && corpo.revendedora) {
    revendedora = await buscarRevendedoraAtiva(corpo.revendedora);
    if (!revendedora) return Response.json({ erro: "Catálogo não encontrado." }, { status: 404 });
  }

  const cliente = (corpo.cliente ?? {}) as Record<string, unknown>;
  const documento = somenteDigitos(texto(cliente.documento));
  const nome = texto(cliente.nome);
  const telefone = somenteDigitos(texto(cliente.telefone));
  const endereco = {
    cep: somenteDigitos(texto(cliente.cep)),
    logradouro: texto(cliente.logradouro),
    numero: texto(cliente.numero, 20),
    complemento: texto(cliente.complemento),
    bairro: texto(cliente.bairro),
    cidade: texto(cliente.cidade),
    uf: texto(cliente.uf, 2).toUpperCase(),
  };

  // No catálogo da revendedora o CPF é opcional (cliente final)
  if (revendedora ? documento && !documentoValido(documento) : !documentoValido(documento))
    return Response.json({ erro: "CPF ou CNPJ inválido." }, { status: 400 });
  if (nome.length < 3 || telefone.length < 10) return Response.json({ erro: "Dados de contato incompletos." }, { status: 400 });
  if (endereco.cep.length !== 8 || !endereco.logradouro || !endereco.numero || !endereco.cidade || !endereco.uf)
    return Response.json({ erro: "Endereço incompleto." }, { status: 400 });

  // Recalcula tudo no servidor a partir do cadastro de produtos
  const itens = (typeof corpo.itens === "object" && corpo.itens ? corpo.itens : {}) as Itens;
  const resumo = calcularResumo(itens, {
    codigoCupom: texto(corpo.cupom, 40),
    entregaId: texto(corpo.entregaId, 40),
    revendedora: revendedora ? { margem: revendedora.margem } : undefined,
  });
  if (resumo.linhas.length === 0) return Response.json({ erro: "Carrinho vazio." }, { status: 400 });
  // O pedido mínimo vale para o atacado; no catálogo da revendedora a cliente final compra qualquer quantidade
  if (!revendedora && !atingiuMinimo(resumo.subtotal, resumo.pecas))
    return Response.json({ erro: "Pedido abaixo do mínimo." }, { status: 400 });
  if (!resumo.entrega) return Response.json({ erro: "Escolha a forma de entrega." }, { status: 400 });

  const pedido: Pedido = {
    id: randomBytes(9).toString("base64url"),
    numero: await proximoNumero(),
    criadoEm: new Date().toISOString(),
    cliente: { nome, documento, telefone },
    endereco,
    entrega: { id: resumo.entrega.id, titulo: resumo.entrega.titulo, valor: resumo.frete },
    itens: resumo.linhas.map((l) => ({
      produtoId: l.produto.id,
      referencia: l.produto.referencia,
      nome: l.produto.nome,
      foto: l.produto.fotos[0],
      preco: l.preco,
      precoAtacado: l.precoAtacado,
      precosTamanho: l.precosTamanho,
      precosAtacadoTamanho: l.precosAtacadoTamanho,
      cores: l.produto.cores.map(({ nome, hex, amostra }) => ({ nome, hex, amostra })),
      tamanhos: l.produto.tamanhos,
      legendaTamanhos: l.produto.legendaTamanhos,
      grade: l.grade,
      pecas: l.pecas,
      subtotal: l.subtotal,
    })),
    observacao: texto(corpo.observacao, 1000),
    cupom: resumo.cupom?.codigo,
    pecas: resumo.pecas,
    subtotal: resumo.subtotal,
    desconto: resumo.desconto,
    frete: resumo.frete,
    total: resumo.total,
    totalAtacado: resumo.totalAtacado,
    revendedora: revendedora
      ? { usuario: revendedora.usuario, nome: revendedora.nome, whatsapp: revendedora.whatsapp, margem: revendedora.margem }
      : undefined,
    meta: await dadosMeta(),
  };

  try {
    await salvarPedido(pedido);
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Não foi possível salvar o pedido. Tente novamente." }, { status: 500 });
  }
  try {
    await registrarPedidoDaCliente(pedido);
  } catch (err) {
    // A ficha da cliente é secundária: o pedido já foi salvo
    console.error(err);
  }

  return Response.json({ id: pedido.id, numero: pedido.numero });
}
