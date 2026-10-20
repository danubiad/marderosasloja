import { buscarImagemFoto } from "@/lib/revendedoras";

// Foto/logo da revendedora. O endereço leva ?v=<versão>, então pode ficar em cache por muito tempo.
export async function GET(_request: Request, { params }: { params: Promise<{ usuario: string }> }) {
  const { usuario } = await params;
  const base64 = await buscarImagemFoto(usuario);
  if (!base64) return new Response("Foto não encontrada.", { status: 404 });

  return new Response(new Uint8Array(Buffer.from(base64, "base64")), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
