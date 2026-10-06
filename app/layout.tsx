import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
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
    process.env.VERCEL ? `https://${loja.dominio}` : "http://localhost:3000",
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
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <CarrinhoProvider>{children}</CarrinhoProvider>
      </body>
    </html>
  );
}
