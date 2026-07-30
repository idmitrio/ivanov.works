import type { Metadata } from "next";
import "./globals.css";
import YandexMetrika from "./yandex-metrika";

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
      </head>
      <body>
        {children}
        <YandexMetrika />
      </body>
    </html>
  );
}
