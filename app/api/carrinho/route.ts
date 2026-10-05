import { calcularResumo, type Itens } from "@/lib/calculo";
import { registrarAtividade } from "@/lib/clientes";
import { somenteDigitos } from "@/lib/format";
import { buscarRevendedoraAtiva } from "@/lib/revendedoras";

// Recebe o carrinho da cliente (nome + WhatsApp + itens) para o painel mostrar carrinhos e clientes.
export async function POST(request: Request) {
  let corpo: Record<string, unknown>;
  try {
    const texto = await request.text();
    if (texto.length > 50_000) return Response.json({ erro: "Carrinho grande demais." }, { status: 413 });
    corpo = JSON.parse(texto);
  } catch {
    return Response.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  const telefone = somenteDigitos(String(corpo.telefone ?? "")).slice(0, 11);
  const nome = String(corpo.nome ?? "").trim().slice(0, 80);
  if (telefone.length < 10 || nome.length < 2) return Response.json({ erro: "Dados inválidos." }, { status: 400 });

  let revendedora: Awaited<ReturnType<typeof buscarRevendedoraAtiva>> = null;
  if (typeof corpo.revendedora === "string" && corpo.revendedora) {
    revendedora = await buscarRevendedoraAtiva(corpo.revendedora);
    if (!revendedora) return Response.json({ erro: "Catálogo não encontrado." }, { status: 404 });
  }

  // Recalcula a partir do cadastro: só guarda produtos/cores/tamanhos que existem
  const itens = (typeof corpo.itens === "object" && corpo.itens ? corpo.itens : {}) as Itens;
  const resumo = calcularResumo(itens, { revendedora: revendedora ? { margem: revendedora.margem } : undefined });
  const itensValidos: Itens = Object.fromEntries(resumo.linhas.map((l) => [l.produto.id, l.grade]));

  try {
    await registrarAtividade({
      telefone,
      nome,
      revendedora: revendedora?.usuario,
      itens: itensValidos,
      pecas: resumo.pecas,
      valor: resumo.subtotal,
      resumo: resumo.linhas.map((l) => `${l.produto.nome} (${l.pecas})`),
    });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Não foi possível salvar." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
