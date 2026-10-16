"use client";

import { useState } from "react";
import { IconeBaixar } from "@/components/icones";

// Botão discreto em cima da foto para a revendedora salvar a imagem e postar no Instagram.
// Converte para JPG (o Instagram não aceita .webp em todo celular). No celular abre o menu de
// compartilhar ("Salvar imagem" manda para a galeria); no computador baixa o arquivo direto.
export function BotaoBaixarFoto({ src, nome }: { src: string; nome: string }) {
  const [baixando, setBaixando] = useState(false);

  async function baixar() {
    if (baixando) return;
    setBaixando(true);
    try {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("sem canvas");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.92));
      if (!blob) throw new Error("sem imagem");
      const arquivo = new File([blob], `${nome}.jpg`, { type: "image/jpeg" });

      const celular = window.matchMedia("(pointer: coarse)").matches;
      if (celular && navigator.canShare?.({ files: [arquivo] })) {
        try {
          await navigator.share({ files: [arquivo] });
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return; // cancelou o menu
        }
      }
      const url = URL.createObjectURL(arquivo);
      const a = document.createElement("a");
      a.href = url;
      a.download = arquivo.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      window.open(src, "_blank"); // último recurso: abre a foto para salvar segurando o dedo
    } finally {
      setBaixando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={baixar}
      className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55"
      aria-label="Baixar foto"
      title="Baixar foto"
    >
      <IconeBaixar className={`size-5 ${baixando ? "animate-pulse" : ""}`} />
    </button>
  );
}
