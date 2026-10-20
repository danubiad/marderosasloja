import { IconeWhatsapp } from "@/components/icones";
import { AvatarRevendedora } from "@/components/MarcaRevendedora";
import { formatarTelefone } from "@/lib/format";
import type { RevendedoraNoSite } from "@/lib/loja";

/** Cartão de apresentação da revendedora no catálogo dela (sem a marca da loja). */
export function BioRevendedora({ r, totalProdutos }: { r: RevendedoraNoSite; totalProdutos: number }) {
  return (
    <section className="mx-auto max-w-5xl px-3 pt-5">
      <div className="rounded-2xl border border-linha bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <AvatarRevendedora r={r} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold leading-tight">{r.nome}</h2>
            <p className="text-sm text-suave">Moda íntima e lingerie</p>
            <p className="mt-1 text-xs text-suave">{totalProdutos} produtos</p>
          </div>
        </div>
        <p className="mt-3 text-[15px] leading-snug">
          Moda íntima com elegância e qualidade. Escolha suas peças, monte o pedido e envie pelo WhatsApp.
        </p>
        <a
          href={`https://wa.me/55${r.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-sucesso py-2.5 text-sm font-semibold text-white"
        >
          <IconeWhatsapp className="size-4" /> Falar com {r.nome.split(" ")[0]} · {formatarTelefone(r.whatsapp)}
        </a>
      </div>
    </section>
  );
}
