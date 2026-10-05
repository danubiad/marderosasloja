import Image from "next/image";
import { IconeWhatsapp } from "@/components/icones";
import { formatarTelefone } from "@/lib/format";

/** Cartão de apresentação da revendedora no catálogo dela. */
export function BioRevendedora({ nome, whatsapp, totalProdutos }: { nome: string; whatsapp: string; totalProdutos: number }) {
  return (
    <section className="mx-auto max-w-5xl px-3 pt-5">
      <div className="rounded-2xl border border-linha bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-dourado to-rose-400 p-[3px]">
            <div className="flex size-full items-center justify-center rounded-full border-2 border-white bg-creme font-serif text-3xl text-dourado-escuro">
              {nome.trim().charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold leading-tight">{nome}</h2>
            <p className="text-sm text-suave">Revendedora oficial</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-suave">
              <Image src="/logo/logo.jpg" alt="" width={36} height={24} className="h-5 w-auto" />
              Mar de Rosas Lingerie · {totalProdutos} produtos
            </div>
          </div>
        </div>
        <p className="mt-3 text-[15px] leading-snug">
          Moda íntima com elegância e qualidade. Escolha suas peças, monte o pedido e envie pelo WhatsApp.
        </p>
        <a
          href={`https://wa.me/55${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-sucesso py-2.5 text-sm font-semibold text-white"
        >
          <IconeWhatsapp className="size-4" /> Falar com {nome.split(" ")[0]} · {formatarTelefone(whatsapp)}
        </a>
      </div>
    </section>
  );
}
