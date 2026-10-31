import "server-only";
import { loja } from "@/lib/config";

// E-mails do painel (link de nova senha) pelo Resend: chave RESEND_API_KEY na Vercel.
// Sem domínio próprio verificado no Resend, ele só entrega no e-mail da própria conta do Resend.

export function emailConfigurado() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function enviarEmail(para: string, assunto: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || `${loja.vendedora} <onboarding@resend.dev>`,
      to: [para],
      subject: assunto,
      html,
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 300)}`);
}
