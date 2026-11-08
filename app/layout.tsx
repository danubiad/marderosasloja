import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { Clarity } from "@/components/Clarity";
import { MetaPixel } from "@/components/MetaPixel";
import { RegistroVisitas } from "@/components/RegistroVisitas";
import { CarrinhoProvider } from "@/lib/carrinho";
import { loja } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL || process.env.PRODUCAO ? `https://${loja.dominio}` : "http://localhost:3000",
  ),
  title: `${loja.nome} — Catálogo Atacado`,
  description: loja.slogan,
  openGraph: {
    title: `${loja.nome} — Catálogo Atacado`,
    description: loja.slogan,
    images: ["/logo/logo.jpg"],
    locale: "pt_BR",
    type: "website",
  },
  // Verificação do domínio da sacolinha no Meta (srv2083377.hstgr.cloud; antes marderosasloja.vercel.app). Nunca tirar
  verification: {
    other: {
      // vercel.app (antigo) e srv2083377.hstgr.cloud (sacolinha desde 08/11/2026): cada domínio tem o seu código
      "facebook-domain-verification": ["ligrcm5jfod7t6mx6fpb3q84unkqzy", "53luuiwx0eztn12ymuumylbiqjhje9"],
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <CarrinhoProvider>{children}</CarrinhoProvider>
        <MetaPixel />
        <Clarity />
        <RegistroVisitas />
      </body>
    </html>
  );
}
