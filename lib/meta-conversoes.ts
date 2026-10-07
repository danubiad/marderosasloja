import "server-only";
import { createHash } from "crypto";
import { PIXEL_ID } from "@/lib/pixel";
import { marcarCompraEnviadaMeta, type Pedido, type StatusPedido } from "@/lib/pedidos";

// API de Conversões do Meta: quando a loja confirma a venda no painel, o site avisa o Meta
// direto do servidor que a cliente comprou. Precisa do token META_CAPI_TOKEN (na Vercel).

/** Status que contam como venda fechada. */
const vendaFechada: StatusPedido[] = ["confirmado", "separando", "enviado", "concluido"];

const hash = (v: string) => createHash("sha256").update(v).digest("hex");
const limpo = (v: string) => v.trim().toLowerCase();

function dadosCliente(p: Pedido) {
  const [nome, ...resto] = limpo(p.cliente.nome).split(/\s+/);
  const telefone = p.cliente.telefone.length <= 11 ? `55${p.cliente.telefone}` : p.cliente.telefone;
  const campos: Record<string, string | undefined> = {
    ph: telefone,
    fn: nome,
    ln: resto.at(-1),
    ct: limpo(p.endereco.cidade).replace(/\s+/g, ""),
    st: limpo(p.endereco.uf),
    zp: p.endereco.cep,
    country: "br",
    external_id: p.cliente.documento || undefined,
  };
  const user_data: Record<string, string> = {};
  for (const [k, v] of Object.entries(campos)) if (v) user_data[k] = hash(v);
  if (p.meta?.fbp) user_data.fbp = p.meta.fbp;
  if (p.meta?.fbc) user_data.fbc = p.meta.fbc;
  if (p.meta?.ip) user_data.client_ip_address = p.meta.ip;
  if (p.meta?.navegador) user_data.client_user_agent = p.meta.navegador;
  return user_data;
}

/** Envia a compra ao Meta uma única vez, quando o pedido passa para um status de venda fechada. */
export async function enviarCompraMeta(p: Pedido) {
  const token = process.env.META_CAPI_TOKEN;
  // Pedidos antigos (sem `meta`) já foram contados como compra pelo Pixel no envio
  if (!token || !p.meta || p.compraEnviadaMeta || !vendaFechada.includes(p.status ?? "novo")) return;

  const evento = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: `compra-${p.id}`,
    action_source: "website",
    event_source_url: p.meta.url,
    user_data: dadosCliente(p),
    custom_data: {
      currency: "BRL",
      value: p.totalAtacado ?? p.total,
      num_items: p.pecas,
      content_type: "product",
      content_ids: p.itens.map((i) => i.referencia),
      order_id: String(p.numero),
    },
  };

  try {
    const resposta = await fetch(`https://graph.facebook.com/v23.0/${PIXEL_ID}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [evento] }),
    });
    if (!resposta.ok) throw new Error(`Meta respondeu ${resposta.status}: ${await resposta.text()}`);
    await marcarCompraEnviadaMeta(p.id);
  } catch (err) {
    // A mudança de status no painel não pode falhar por causa do Meta
    console.error("Falha ao enviar compra ao Meta", err);
  }
}
