"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CLARITY_ID } from "@/lib/clarity";

type JanelaClarity = { clarity?: (comando: string) => void };

/** Carrega o Clarity e pausa a gravação enquanto a dona estiver no painel. */
export function Clarity() {
  const painel = usePathname().startsWith("/painel");

  useEffect(() => {
    (window as unknown as JanelaClarity).clarity?.(painel ? "stop" : "start");
  }, [painel]);

  if (!CLARITY_ID) return null;

  return (
    <Script id="clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${CLARITY_ID}");
if(location.pathname.startsWith('/painel'))clarity('stop');`}
    </Script>
  );
}
