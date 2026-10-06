import Image from "next/image";
import { IconeWhatsapp } from "@/components/icones";
import { loja, perfil } from "@/lib/config";

/** Cartão no estilo de uma bio do Instagram, com os dados da loja. */
export function BioLoja({ totalProdutos }: { totalProdutos: number }) {
  return (
    <section className="mx-auto max-w-5xl px-3 pt-5">
      <div className="rounded-2xl border border-linha bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="shrink-0 rounded-full bg-gradient-to-tr from-dourado to-rose-400 p-[3px]">
            <Image
              src={perfil.foto}
              alt={loja.nome}
              width={88}
              height={88}
              className="size-20 rounded-full border-2 border-white object-cover sm:size-22"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-tight sm:text-lg">{perfil.nome}</h2>
            <dl className="mt-2 flex gap-5 text-sm">
              <div>
                <dt className="sr-only">Produtos</dt>
                <dd className="font-semibold">{totalProdutos}</dd>
                <dd className="text-suave">produtos</dd>
              </div>
              <div>
                <dt className="sr-only">Seguidores</dt>
                <dd className="font-semibold">{perfil.seguidores}</dd>
                <dd className="text-suave">seguidores</dd>
              </div>
              <div>
                <dt className="sr-only">Desde</dt>
                <dd className="font-semibold">{perfil.desde}</dd>
                <dd className="text-suave">desde</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-3 text-[15px] leading-snug">
          <p className="text-suave">{perfil.categoria}</p>
          {perfil.bio.map((linha) => (
            <p key={linha}>{linha}</p>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <a
            href={perfil.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg bg-texto py-2 text-center text-sm font-semibold text-white"
          >
            Seguir @{perfil.usuario}
          </a>
          <a
            href={`https://wa.me/${loja.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-fundo py-2 text-sm font-semibold"
          >
            <IconeWhatsapp className="size-4 text-sucesso" /> WhatsApp
          </a>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 border-t border-linha pt-3 text-xs font-medium">
          <span className="rounded-full bg-green-50 px-3 py-1.5 text-sucesso">✓ Atacado</span>
          <span className="rounded-full bg-fundo px-3 py-1.5">
            <strong>{perfil.pedidos.toLocaleString("pt-BR")}</strong> pedidos
          </span>
          <span className="rounded-full bg-fundo px-3 py-1.5">
            <strong>{perfil.visitas.toLocaleString("pt-BR")}</strong> visitas
          </span>
        </div>
      </div>
    </section>
  );
}
