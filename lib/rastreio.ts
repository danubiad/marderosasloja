// Envia eventos do catálogo da loja para a aba Dados do painel (não usar no catálogo das revendedoras).

export type EventoCatalogo = "sessao" | "produto" | "carrinho" | "whatsapp";

export function registrarEvento(tipo: EventoCatalogo, extra?: { origem?: string; campanha?: string }) {
  try {
    const corpo = JSON.stringify({ tipo, ...extra });
    const enviado = navigator.sendBeacon?.("/api/eventos", new Blob([corpo], { type: "application/json" }));
    if (!enviado) void fetch("/api/eventos", { method: "POST", body: corpo, keepalive: true }).catch(() => {});
  } catch {}
}

const sitesConhecidos = ["instagram", "facebook", "google", "whatsapp", "tiktok", "youtube", "bing"];

/** De onde a cliente veio: utm_source, anúncio do Meta, o site que mandou para cá (Instagram, Google...) ou "direto". */
export function origemDaVisita() {
  const url = new URL(location.href);
  const campanha = url.searchParams.get("utm_campaign") ?? undefined;
  const utm = url.searchParams.get("utm_source");
  if (utm) return { origem: utm, campanha };
  if (url.searchParams.has("fbclid")) return { origem: "anuncio-meta", campanha };

  let site = "";
  try {
    site = document.referrer ? new URL(document.referrer).hostname : "";
  } catch {}
  if (!site || site === location.hostname) return { origem: "direto", campanha };
  if (site.includes("wa.me")) return { origem: "whatsapp", campanha };
  return { origem: sitesConhecidos.find((n) => site.includes(n)) ?? site.replace(/^www\./, ""), campanha };
}
