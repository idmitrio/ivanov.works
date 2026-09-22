"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";

const counterId = 109276483;
const counterCode = `
(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) { return; }
    }
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,
    a.parentNode.insertBefore(k,a)
})(window, document, 'script',
   'https://mc.yandex.ru/metrika/tag.js?id=${counterId}', 'ym');

ym(${counterId}, 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: "dataLayer",
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true
});
`;

declare global {
  interface Window {
    ym?: (
      id: number,
      method: string,
      argument?: string | Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => void;
  }
}

export default function YandexMetrika() {
  const pathname = usePathname();
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    const currentUrl = window.location.href;

    if (previousUrl.current === null) {
      previousUrl.current = currentUrl;
      return;
    }

    if (previousUrl.current === currentUrl) return;

    window.ym?.(counterId, "hit", currentUrl, {
      title: document.title,
      referer: previousUrl.current,
    });
    previousUrl.current = currentUrl;
  }, [pathname]);

  return (
    <Script
      id="yandex-metrika"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: counterCode }}
    />
  );
}
