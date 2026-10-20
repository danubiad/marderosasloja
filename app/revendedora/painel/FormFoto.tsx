"use client";

import { useState, useTransition } from "react";
import { AvatarRevendedora } from "@/components/MarcaRevendedora";
import type { RevendedoraNoSite } from "@/lib/loja";
import { removerFoto, salvarFoto } from "../actions";

/** Diminui a imagem no celular antes de enviar (foto de câmera passa do limite de envio). */
async function diminuir(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; // logo em PNG transparente fica com fundo branco
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, erro) => canvas.toBlob((b) => (b ? ok(b) : erro(new Error())), "image/jpeg", 0.9));
}

export function FormFoto({ revendedora }: { revendedora: RevendedoraNoSite }) {
  const [tipo, setTipo] = useState(revendedora.tipoFoto ?? "foto");
  const [mensagem, setMensagem] = useState("");
  const [enviando, iniciar] = useTransition();

  function enviar(arquivo: File | undefined) {
    if (!arquivo) return;
    setMensagem("");
    iniciar(async () => {
      try {
        const dados = new FormData();
        dados.set("foto", await diminuir(arquivo), "foto.jpg");
        dados.set("tipo", tipo);
        setMensagem(await salvarFoto(dados));
      } catch {
        setMensagem("Não consegui abrir essa imagem. Tente outra.");
      }
    });
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm text-suave">
        Aparece no topo do seu catálogo. Suas clientes não veem a marca da loja, só o seu nome e a sua foto ou logo.
      </p>
      <div className="flex items-center gap-4">
        <AvatarRevendedora r={revendedora} />
        <div className="grid gap-1.5 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="tipo" checked={tipo === "foto"} onChange={() => setTipo("foto")} /> É uma foto minha
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="tipo" checked={tipo === "logo"} onChange={() => setTipo("logo")} /> É a minha logo
          </label>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label
          className={`cursor-pointer rounded-md bg-texto px-5 py-2.5 font-semibold text-white ${enviando ? "pointer-events-none opacity-50" : ""}`}
        >
          {enviando ? "Enviando..." : revendedora.foto ? "Trocar imagem" : "Escolher imagem"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={enviando}
            onChange={(e) => {
              enviar(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {revendedora.foto && (
          <button
            type="button"
            disabled={enviando}
            onClick={() => iniciar(() => removerFoto())}
            className="rounded-md border border-linha px-4 py-2.5 text-sm"
          >
            Remover
          </button>
        )}
        {mensagem && <span className={mensagem === "Salvo!" ? "text-sucesso" : "text-promo"}>{mensagem}</span>}
      </div>
    </div>
  );
}
