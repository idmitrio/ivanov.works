import type { Metadata } from "next";
import "./globals.css";
import YandexMetrika from "./yandex-metrika";

export const metadata: Metadata = {
  metadataBase: new URL("https://ivanov.works"),
  title: "Внедрение ИИ в бизнес-процессы — ИИ-студия Дмитрия Иванова",
  description:
    "Разрабатываем управляемые ИИ-решения для документов, заявок, поддержки и внутренних баз знаний. Начинаем с проверки на ваших данных.",
  alternates: {
    canonical: "/",
  },
  verification: {
    yandex: "5ea78253f763e6ef",
  },
  openGraph: {
    title: "Сокращаем ручную работу в процессах компании",
    description:
      "Управляемые ИИ-решения для документов, заявок, поддержки и внутренних баз знаний. Начинаем с проверки на ваших данных.",
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
      "Управляемые ИИ-решения для документов, заявок, поддержки и внутренних баз знаний. Начинаем с проверки на ваших данных.",
    images: ["/og.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://ivanov.works/#organization",
      name: "ИИ-студия Дмитрия Иванова",
      url: "https://ivanov.works/",
      logo: "https://ivanov.works/brand/ivanov-ai-logo-black.svg",
      email: "dmitry@ivanov.works",
      founder: { "@id": "https://ivanov.works/#founder" },
      sameAs: [
        "https://t.me/dmitrio",
        "https://max.ru/u/f9LHodD0cOIl7MPfiO0OlgTYfDEeoMc8C2UPsPUluf-6LFlEINKfwLu4-O0",
      ],
    },
    {
      "@type": "Person",
      "@id": "https://ivanov.works/#founder",
      name: "Дмитрий Иванов",
      url: "https://ivanov.works/#about",
      worksFor: { "@id": "https://ivanov.works/#organization" },
    },
    {
      "@type": "WebSite",
      "@id": "https://ivanov.works/#website",
      url: "https://ivanov.works/",
      name: "ИИ-студия Дмитрия Иванова",
      inLanguage: "ru-RU",
      publisher: { "@id": "https://ivanov.works/#organization" },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        {children}
        <YandexMetrika />
      </body>
    </html>
  );
}
