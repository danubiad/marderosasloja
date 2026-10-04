type Props = {
  hex: string;
  /** Recorte do tecido/estampa; quando existe, aparece no lugar da cor sólida */
  amostra?: string;
  className?: string;
};

export function BolinhaCor({ hex, amostra, className = "size-6" }: Props) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full bg-cover bg-center ring-1 ring-black/10 ${className}`}
      style={{ backgroundColor: hex, backgroundImage: amostra ? `url("${amostra}")` : undefined }}
      aria-hidden
    />
  );
}
