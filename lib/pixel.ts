// Pixel do Meta (Facebook/Instagram): mede visitas, produtos vistos, carrinho e pedidos.

export const PIXEL_ID = "483350873657439";

type Fbq = (comando: "track", evento: string, dados?: Record<string, unknown>) => void;

type JanelaPixel = { fbq?: Fbq; fbqPendentes?: unknown[][] };

/** Envia um evento ao Pixel. Se ele ainda não carregou, guarda o evento para o script enviar ao iniciar. */
export function rastrear(evento: string, dados?: Record<string, unknown>) {
  const w = window as unknown as JanelaPixel;
  if (w.fbq) w.fbq("track", evento, dados);
  else (w.fbqPendentes ??= []).push(["track", evento, dados]);
}
