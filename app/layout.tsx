import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ИИ-решения для бизнес-процессов — ИИ-студия Дмитрия Иванова",
  description:
    "Создаем управляемые ИИ-решения для обработки документов, заявок, поддержки и внутренних баз знаний. Начинаем с одного процесса, проверяем качество и экономику на данных компании.",
  openGraph: {
    title: "Сокращаем ручную работу в операционных процессах",
    description:
      "ИИ-студия Дмитрия Иванова: начинаем с одного процесса и проверяем качество и экономику решения на данных компании.",
    type: "website",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Сокращаем ручную работу в операционных процессах",
    description: "ИИ-студия Дмитрия Иванова",
  },
};

const yandexMetrika = `
(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=109276483', 'ym');

ym(109276483, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-96x96.png" sizes="96x96" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta property="og:image" content="/og.png" />
        <meta name="twitter:image" content="/og.png" />
        <script
          id="yandex-metrika"
          type="text/javascript"
          dangerouslySetInnerHTML={{ __html: yandexMetrika }}
        />
      </head>
      <body>
        {children}
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/109276483"
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
      </body>
    </html>
  );
}
