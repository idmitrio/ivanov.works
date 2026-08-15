import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Шаблон будущего кейса — ИИ-студия Дмитрия Иванова",
  description: "Служебный шаблон для подготовки будущих кейсов студии.",
  alternates: {
    canonical: "/case-template",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CaseTemplateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
