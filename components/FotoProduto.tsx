import Image from "next/image";
import type { Cor } from "@/data/produtos";

type Props = {
  src?: string;
  alt: string;
  /** Cores usadas para montar a imagem provisória quando não há foto */
  cores?: Cor[];
  sizes?: string;
  priority?: boolean;
  className?: string;
};

export function FotoProduto({ src, alt, cores = [], sizes = "50vw", priority, className = "" }: Props) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-fundo ${className}`}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }

  // Imagem provisória: faixas com as cores do produto + logo
  return (
    <div className={`relative flex overflow-hidden bg-fundo ${className}`} role="img" aria-label={alt}>
      {cores.map((cor) => (
        <div key={cor.nome} className="flex-1 opacity-80" style={{ background: cor.hex }} />
      ))}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-3 pb-3 pt-10 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/90">Foto em breve</span>
      </div>
    </div>
  );
}
