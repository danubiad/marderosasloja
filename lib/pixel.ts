// Pixel do Meta (Facebook/Instagram): mede visitas, produtos vistos, carrinho e pedidos.

export const PIXEL_ID = "483350873657439";

type Fbq = (comando: "track", evento: string, dados?: Record<string, unknown>) => void;

/** Envia um evento ao Pixel, se ele estiver carregado. */
export function rastrear(evento: string, dados?: Record<string, unknown>) {
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (fbq) fbq("track", evento, dados);
}
