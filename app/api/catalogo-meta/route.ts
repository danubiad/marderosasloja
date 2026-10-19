import { loja, textoPedidoMinimo } from "@/lib/config";
import { produtos } from "@/data/produtos";

// Lista de produtos que o Gerenciador de Comércio da Meta lê todo dia (sacolinha do Instagram/Facebook).
// O id é a referência (MR-0xx), o mesmo content_id que o Pixel e a API de Conversões mandam.
// Produto sem preço definido (preco 0) fica de fora, porque não pode ser pedido.

const site = `https://${loja.dominio}`;

const colunas = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "sale_price",
  "link",
  "image_link",
  "additional_image_link",
  "brand",
  "product_type",
] as const;

function celula(valor: string) {
  return /[",\n\r]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

function preco(valor: number) {
  return `${valor.toFixed(2)} BRL`;
}

/** A Meta não aceita WebP: as fotos vão pela rota que converte para JPG. */
function fotoJpg(caminho: string) {
  return `${site}/api/foto${caminho.replace(/\.webp$/, ".jpg")}`;
}

function descricao(p: (typeof produtos)[number]) {
  if (p.descricao.trim()) return `${p.descricao.trim()}\n\n${textoPedidoMinimo}.`;
  const partes = [`${p.nome} — lingerie no atacado, pronta entrega.`];
  if (p.cores.length) partes.push(`Cores: ${p.cores.map((c) => c.nome).join(", ")}.`);
  if (p.tamanhos.length) partes.push(`Tamanhos: ${p.tamanhos.join(", ")}.`);
  partes.push(`${textoPedidoMinimo}.`);
  return partes.join(" ");
}

export function GET() {
  const linhas = produtos
    .filter((p) => p.preco > 0 && p.fotos.length > 0)
    .map((p) => {
      const emPromocao = p.precoDe && p.precoDe > p.preco;
      const item: Record<(typeof colunas)[number], string> = {
        id: p.referencia,
        title: p.nome.slice(0, 200),
        description: descricao(p).slice(0, 9999),
        availability: "in stock",
        condition: "new",
        price: preco(emPromocao ? p.precoDe! : p.preco),
        sale_price: emPromocao ? preco(p.preco) : "",
        link: `${site}/produto/${p.slug}`,
        image_link: fotoJpg(p.fotos[0]),
        additional_image_link: p.fotos.slice(1, 11).map(fotoJpg).join(","),
        brand: loja.nome,
        product_type: p.categorias.join(" > "),
      };
      return colunas.map((c) => celula(item[c])).join(",");
    });

  return new Response([colunas.join(","), ...linhas].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600",
    },
  });
}
