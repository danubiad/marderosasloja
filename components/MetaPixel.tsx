"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { PIXEL_ID, rastrear } from "@/lib/pixel";

/** Carrega o Pixel do Meta e registra cada página visitada (fora do painel da loja). */
export function MetaPixel() {
  const pathname = usePathname();
  const primeira = useRef(true);
  const painel = pathname.startsWith("/painel");

  useEffect(() => {
    // A primeira visita já é registrada pelo próprio script ao carregar
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    if (!painel) rastrear("PageView");
  }, [pathname, painel]);

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');if(!location.pathname.startsWith('/painel'))fbq('track','PageView');`}
    </Script>
  );
}
