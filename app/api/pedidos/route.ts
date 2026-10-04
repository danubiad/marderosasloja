import { randomBytes } from "crypto";
import { calcularResumo, type Itens } from "@/lib/calculo";
import { pedidoMinimo } from "@/lib/config";
import { documentoValido, somenteDigitos } from "@/lib/format";
import { proximoNumero, salvarPedido, type Pedido } from "@/lib/pedidos";

const texto = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ erro: "Pedido inválido." }, { status: 400 });
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

  if (!documentoValido(documento)) return Response.json({ erro: "CPF ou CNPJ inválido." }, { status: 400 });
  if (nome.length < 3 || telefone.length < 10) return Response.json({ erro: "Dados de contato incompletos." }, { status: 400 });
  if (endereco.cep.length !== 8 || !endereco.logradouro || !endereco.numero || !endereco.cidade || !endereco.uf)
    return Response.json({ erro: "Endereço incompleto." }, { status: 400 });

  // Recalcula tudo no servidor a partir do cadastro de produtos
  const itens = (typeof corpo.itens === "object" && corpo.itens ? corpo.itens : {}) as Itens;
  const resumo = calcularResumo(itens, texto(corpo.cupom, 40), texto(corpo.entregaId, 40));
  if (resumo.linhas.length === 0) return Response.json({ erro: "Carrinho vazio." }, { status: 400 });
  if (resumo.subtotal < pedidoMinimo) return Response.json({ erro: "Pedido abaixo do valor mínimo." }, { status: 400 });
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
      preco: l.produto.preco,
      cores: l.produto.cores.map(({ nome, hex }) => ({ nome, hex })),
      tamanhos: l.produto.tamanhos,
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
  };

  try {
    await salvarPedido(pedido);
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Não foi possível salvar o pedido. Tente novamente." }, { status: 500 });
  }

  return Response.json({ id: pedido.id, numero: pedido.numero });
}
