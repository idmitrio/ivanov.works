import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ivanov.works"),
  title: "ИИ-решения для бизнес-процессов — ИИ-студия Дмитрия Иванова",
  description:
    "Создаем управляемые ИИ-решения для обработки документов, заявок, поддержки и внутренних баз знаний. Начинаем с одного процесса, проверяем качество и экономику на данных компании.",
  icons: {
    icon: "/brand/ivanov-ai-logo.svg",
    shortcut: "/brand/ivanov-ai-logo.svg",
  },
  openGraph: {
    title: "Сокращаем ручную работу в операционных процессах",
    description:
      "ИИ-студия Дмитрия Иванова: начинаем с одного процесса и проверяем качество и экономику решения на данных компании.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    type: "website",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Сокращаем ручную работу в операционных процессах",
    description: "ИИ-студия Дмитрия Иванова",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
