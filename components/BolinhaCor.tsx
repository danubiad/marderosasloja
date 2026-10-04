type Props = { hex: string; className?: string };

export function BolinhaCor({ hex, className = "size-6" }: Props) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ring-1 ring-black/10 ${className}`}
      style={{ background: hex }}
      aria-hidden
    />
  );
}
