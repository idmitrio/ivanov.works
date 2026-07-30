"use client";

import Script from "next/script";

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
      goalOrOptions?: string | Record<string, unknown>,
    ) => void;
  }
}

export default function YandexMetrika() {
  return (
    <Script
      id="yandex-metrika"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: counterCode }}
    />
  );
}
