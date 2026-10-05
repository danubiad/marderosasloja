"use client";

import { useState } from "react";

export function CompartilharLink({ caminho, nome }: { caminho: string; nome: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = `${window.location.origin}${caminho}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Catálogo de ${nome}`, text: "Confira meu catálogo de moda íntima Mar de Rosas!", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }
    } catch {}
  }

  return (
    <button type="button" onClick={compartilhar} className="rounded-md bg-dourado-escuro px-4 py-2.5 font-semibold text-white">
      {copiado ? "Link copiado!" : "Compartilhar meu catálogo"}
    </button>
  );
}
