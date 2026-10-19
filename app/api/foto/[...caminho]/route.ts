import sharp from "sharp";
import { loja } from "@/lib/config";

// Entrega a foto de um produto em JPG, para o catálogo da Meta:
// /api/foto/produtos/<slug>/1.jpg converte public/produtos/<slug>/1.webp.
export async function GET(_request: Request, { params }: { params: Promise<{ caminho: string[] }> }) {
  const { caminho } = await params;
  const arquivo = caminho.join("/");
  if (caminho[0] !== "produtos" || caminho.some((parte) => parte === ".." || parte === "") || !arquivo.endsWith(".jpg")) {
    return new Response("Foto não encontrada.", { status: 404 });
  }

  const original = await fetch(`https://${loja.dominio}/${arquivo.replace(/\.jpg$/, ".webp")}`);
  if (!original.ok) return new Response("Foto não encontrada.", { status: 404 });

  const jpg = await sharp(Buffer.from(await original.arrayBuffer()))
    .flatten({ background: "#ffffff" })
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer();

  return new Response(new Uint8Array(jpg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
