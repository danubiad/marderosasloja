import type { NextConfig } from "next";

// Proteções do navegador em todas as páginas
const cabecalhosSeguranca = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Páginas com ações (senha, status, trocas) não podem ser abertas dentro de outro site
const naoEmbutir = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  // Fotos vão direto, sem o otimizador da Vercel: a cota grátis dele acabou e as fotos davam erro 402
  images: { unoptimized: true },
  async headers() {
    return [
      { source: "/(.*)", headers: cabecalhosSeguranca },
      { source: "/painel/:path*", headers: naoEmbutir },
      { source: "/revendedora/:path*", headers: naoEmbutir },
      { source: "/pedido/:path*", headers: naoEmbutir },
    ];
  },
};

export default nextConfig;
