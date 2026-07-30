import type { Metadata } from "next";
import "./globals.css";
import YandexMetrika from "./yandex-metrika";

export const metadata: Metadata = {
  metadataBase: new URL("https://ivanov.works"),
  title: "Внедрение ИИ в бизнес-процессы — ИИ-студия Дмитрия Иванова",
  description:
    "Проверим на одном процессе и ваших данных, справится ли ИИ с задачей, прежде чем разрабатывать и внедрять полноценное решение.",
  openGraph: {
    title: "Сокращаем ручную работу в процессах компании",
    description:
      "Проверим на одном процессе и ваших данных, справится ли ИИ с задачей, прежде чем разрабатывать и внедрять полноценное решение.",
    type: "website",
    locale: "ru_RU",
    siteName: "ИИ-студия Дмитрия Иванова",
    url: "https://ivanov.works",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Логотип ИИ-студии Дмитрия Иванова",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Сокращаем ручную работу в процессах компании",
    description:
      "Проверим на одном процессе и ваших данных, справится ли ИИ с задачей, прежде чем разрабатывать и внедрять полноценное решение.",
    images: ["/og.png"],
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
      </head>
      <body>
        {children}
        <YandexMetrika />
      </body>
    </html>
  );
}
