"use client";

import type { ComponentProps } from "react";
import { registrarEvento } from "@/lib/rastreio";

/** Link do WhatsApp que conta o clique em "Enviar pedido" na aba Dados do painel. */
export function LinkWhatsappRastreado({ registrar, ...props }: ComponentProps<"a"> & { registrar: boolean }) {
  return <a {...props} onClick={() => registrar && registrarEvento("whatsapp")} />;
}
