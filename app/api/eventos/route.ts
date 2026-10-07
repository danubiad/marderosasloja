import { registrarEvento, tiposEvento, type TipoEvento } from "@/lib/eventos";

// Recebe os eventos do catálogo da loja (visita, produto visto, carrinho, clique no WhatsApp).

const rotulo = (v: unknown) =>
  typeof v === "string"
    ? v
        .toLowerCase()
        .normalize("NFD")
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40)
    : "";

export async function POST(request: Request) {
  let corpo: Record<string, unknown>;
  try {
    const texto = await request.text();
    if (texto.length > 1000) return new Response(null, { status: 413 });
    corpo = JSON.parse(texto);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!tiposEvento.includes(corpo.tipo as TipoEvento)) return new Response(null, { status: 400 });

  try {
    await registrarEvento(corpo.tipo as TipoEvento, rotulo(corpo.origem), rotulo(corpo.campanha));
  } catch (err) {
    console.error(err);
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
