"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaixaAviso } from "@/components/FaixaAviso";
import { useCarrinho } from "@/lib/carrinho";
import { useLoja } from "@/lib/loja";
import { totalPecas } from "@/lib/calculo";
import { IconeCarrinho, IconeVideo, IconeVoltar } from "@/components/icones";

type Props = {
  /** Mostra seta de voltar no lugar do logo */
  voltar?: boolean;
  titulo?: string;
  semCarrinho?: boolean;
  children?: React.ReactNode;
};

export function Cabecalho({ voltar, titulo, semCarrinho, children }: Props) {
  const router = useRouter();
  const { base } = useLoja();
  const { itens } = useCarrinho();
  const pecas = Object.values(itens).reduce((acc, g) => acc + totalPecas(g), 0);

  return (
    <header
      className="sticky z-30 border-b border-linha bg-white/95 backdrop-blur"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <FaixaAviso />
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
        {voltar ? (
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push(base || "/"))}
            className="-ml-2 rounded-full p-2 hover:bg-fundo"
            aria-label="Voltar"
          >
            <IconeVoltar />
          </button>
        ) : (
          <Link href={base || "/"} className="flex items-center" aria-label="Início">
            <Image src="/logo/logo.jpg" alt="Mar de Rosas Lingerie" width={96} height={64} className="h-12 w-auto" priority />
          </Link>
        )}

        <div className="min-w-0 flex-1 text-center">
          {titulo && <h1 className="truncate text-lg font-semibold">{titulo}</h1>}
        </div>

        {children}

        {!semCarrinho && (
          <Link href={`${base}/videos`} className="rounded-full p-2 hover:bg-fundo" aria-label="Vídeos">
            <IconeVideo />
          </Link>
        )}

        {!semCarrinho && (
          <Link
            href={`${base}/carrinho`}
            className={`relative rounded-full p-2 ${pecas > 0 ? "bg-dourado-claro/60" : "hover:bg-fundo"}`}
            aria-label={`Carrinho com ${pecas} peças`}
          >
            <IconeCarrinho />
            {pecas > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-dourado-escuro px-1 text-xs font-bold text-white">
                {pecas}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
