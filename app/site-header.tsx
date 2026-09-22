"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useContactModal } from "./contact-modal";

type HeaderSection = "solutions" | "process" | "about" | "faq" | "contacts";

type SiteHeaderProps = {
  active?: HeaderSection | "";
  home?: boolean;
};

const telegram = "https://t.me/dmitrio";
const maxLink =
  "https://max.ru/u/f9LHodD0cOIl7MPfiO0OlgTYfDEeoMc8C2UPsPUluf-6LFlEINKfwLu4-O0";
const email = "mailto:dmitry@ivanov.works";

const navigation: Array<{ id: HeaderSection; label: string }> = [
  { id: "solutions", label: "Решения" },
  { id: "process", label: "Как работаем" },
  { id: "about", label: "О студии" },
  { id: "faq", label: "Ответы на вопросы" },
  { id: "contacts", label: "Контакты" },
];

export default function SiteHeader({ active = "", home = false }: SiteHeaderProps) {
  const [compact, setCompact] = useState(false);
  const [menu, setMenu] = useState(false);
  const { openContactModal } = useContactModal();

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sectionHref = (id: HeaderSection) => `${home ? "" : "/"}#${id}`;

  return (
    <>
      <header className={`site-header ${compact ? "site-header--compact" : ""} ${home ? "" : "site-header--solid"}`}>
        <Link href={home ? "#top" : "/"} className="brand-link" aria-label="На главную">
          <img className="brand-full" src="/brand/ivanov-ai-logo-inv.svg" alt="ИИ-студия Дмитрия Иванова" />
          <img className="brand-sign" src="/brand/ivanov-ai-sign-inv.svg" alt="" />
        </Link>
        <nav className="desktop-nav" aria-label="Основная навигация">
          {navigation.map((item) => (
            <Link
              className={active === item.id ? "active" : ""}
              href={item.id === "solutions" && !home ? "/solutions" : sectionHref(item.id)}
              key={item.id}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="button button--primary header-cta" onClick={openContactModal}>Обсудить процесс</button>
        <button className="icon-button mobile-menu-button" onClick={() => setMenu(true)} aria-label="Открыть меню"><span /><span /><span /></button>
      </header>
      <SiteMenu
        active={active}
        home={home}
        onClose={() => setMenu(false)}
        onForm={openContactModal}
        open={menu}
      />
    </>
  );
}

function SiteMenu({
  active,
  home,
  onClose,
  onForm,
  open,
}: {
  active: HeaderSection | "";
  home: boolean;
  onClose: () => void;
  onForm: () => void;
  open: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add("locked");
    panel.current?.querySelector<HTMLButtonElement>(".menu-close")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && panel.current) {
        const items = Array.from(panel.current.querySelectorAll<HTMLElement>("a,button"));
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("locked");
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  const sectionHref = (id: HeaderSection) => `${home ? "" : "/"}#${id}`;
  const openForm = () => {
    onClose();
    onForm();
  };

  return (
    <div className="menu-panel" role="dialog" aria-modal="true" aria-label="Меню" ref={panel}>
      <div className="menu-top">
        <img src="/brand/ivanov-ai-logo-inv.svg" alt="ИИ-студия Дмитрия Иванова" />
        <button className="icon-button menu-close" onClick={onClose} aria-label="Закрыть меню">×</button>
      </div>
      <nav className="menu-nav">
        {navigation.filter((item) => item.id !== "contacts").map((item) => (
          <Link
            className={active === item.id ? "active" : ""}
            href={item.id === "solutions" && !home ? "/solutions" : sectionHref(item.id)}
            key={item.id}
            onClick={onClose}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <button className="button button--primary menu-cta" onClick={openForm}>Обсудить процесс</button>
      <div className="menu-links">
        <a href={telegram} target="_blank" rel="noreferrer">Telegram <span>↗</span></a>
        <a href={maxLink} target="_blank" rel="noreferrer">MAX <span>↗</span></a>
        <a href={email}>dmitry@ivanov.works <span>↗</span></a>
      </div>
    </div>
  );
}
