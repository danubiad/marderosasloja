import { blackFridayAtiva } from "@/lib/black-friday";

/**
 * Banner da Black Friday (enviado pela dona em 27/11/2026), em cima dos banners do topo, só no catálogo da loja.
 * Computador: o largo (1600x600); celular: o vertical (1080x1350). Some sozinho quando a Black acaba (lib/black-friday.ts).
 */
export function BannerBlackFriday() {
  if (!blackFridayAtiva()) return null;
  return (
    <section className="md:mx-auto md:max-w-5xl md:px-4 md:pt-4">
      <picture>
        <source media="(min-width: 768px)" srcSet="/banners/black-friday-computador.webp" width={1600} height={600} />
        <img
          src="/banners/black-friday-celular.webp"
          width={1080}
          height={1350}
          alt="Todo o site em Black Friday nesta sexta, sábado e domingo"
          fetchPriority="high"
          className="block h-auto w-full bg-black md:rounded-lg"
        />
      </picture>
    </section>
  );
}
