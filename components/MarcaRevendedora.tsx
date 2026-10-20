import type { RevendedoraNoSite } from "@/lib/loja";

/** Foto ou logo da revendedora em círculo; sem imagem, a inicial do nome. */
export function AvatarRevendedora({ r, className = "size-20 text-3xl" }: { r: RevendedoraNoSite; className?: string }) {
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-dourado to-rose-400 p-[3px] ${className}`}>
      {r.foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.foto}
          alt={r.nome}
          className={`size-full rounded-full border-2 border-white bg-white ${r.tipoFoto === "logo" ? "object-contain p-1" : "object-cover"}`}
        />
      ) : (
        <div className="flex size-full items-center justify-center rounded-full border-2 border-white bg-creme font-serif text-dourado-escuro">
          {r.nome.trim().charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

/** No topo do catálogo da revendedora, no lugar da marca da loja: a logo dela, ou a foto + o nome. */
export function MarcaRevendedora({ r }: { r: RevendedoraNoSite }) {
  if (r.foto && r.tipoFoto === "logo") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={r.foto} alt={r.nome} className="h-12 w-auto max-w-40 object-contain" />;
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      {r.foto && <AvatarRevendedora r={r} className="size-11" />}
      <span className="max-w-40 truncate font-serif text-xl font-semibold text-dourado-escuro">{r.nome}</span>
    </span>
  );
}
