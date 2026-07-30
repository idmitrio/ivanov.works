"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const telegram = "https://t.me/dmitrio";
const maxLink =
  "https://max.ru/u/f9LHodD0cOIl7MPfiO0OlgTYfDEeoMc8C2UPsPUluf-6LFlEINKfwLu4-O0";
const email = "mailto:dmitry@ivanov.works";
const yandexMetrikaId = 109276483;

declare global {
  interface Window {
    ym?: (
      counterId: number,
      method: "reachGoal",
      goal: "IW_FEEDBACK_OPEN" | "IW_FEEDBACK_SEND",
    ) => void;
  }
}

function reachGoal(goal: "IW_FEEDBACK_OPEN" | "IW_FEEDBACK_SEND") {
  window.ym?.(yandexMetrikaId, "reachGoal", goal);
}

const solutions = [
  {
    title: "Входящие документы",
    input: "Счета, акты, договоры, заявки, накладные, сканы и письма.",
    system:
      "ИИ извлекает нужные данные и сверяет их с заказом, договором, 1С или ERP. Нашел расхождение или не уверен в результате — передает документ сотруднику на проверку.",
    employee:
      "Проверить отмеченные расхождения, при необходимости исправить данные и подтвердить результат.",
    result:
      "Вручную остается разбирать только спорные случаи, а не каждый документ целиком.",
  },
  {
    title: "Заявки и обращения",
    input: "Письма, формы с сайта, сообщения из мессенджеров и обращения в CRM.",
    system:
      "ИИ определяет, с чем обратился клиент, собирает данные и направляет заявку нужному сотруднику. Если информации не хватает, запрашивает уточнение.",
    employee:
      "Ответить на нестандартный запрос или подключиться, если данных для решения недостаточно.",
    result: "Команде не приходится вручную сортировать весь входящий поток.",
  },
  {
    title: "Поддержка сотрудников и клиентов",
    input: "Типовые вопросы, регламенты и история обращения.",
    system:
      "ИИ готовит ответ по регламентам и истории обращения. Команда быстрее отвечает на типовые вопросы, а сложные случаи сразу передает специалисту.",
    employee:
      "Разобрать сложный случай и подтвердить ответ, когда требуется экспертное решение.",
    result: "Опытные сотрудники меньше отвлекаются на одни и те же вопросы.",
  },
  {
    title: "Поиск по базе знаний",
    input: "Регламенты, инструкции, договоры и проектная документация.",
    system:
      "Помощник находит ответ и показывает источник. Если в документах ответа нет, так и говорит, а не пытается его придумать.",
    employee:
      "Проверить источник и принять решение, если готового ответа в базе знаний нет.",
    result:
      "Сотрудники быстрее находят нужную информацию и реже идут с вопросами к коллегам.",
  },
  {
    title: "Аналитика и контроль показателей",
    input: "Данные из таблиц, CRM, ERP и других рабочих систем.",
    system:
      "ИИ анализирует данные по заданным правилам: готовит сводки, сравнивает периоды и показывает отклонения.",
    employee:
      "Разобрать отмеченные отклонения и принять управленческое решение.",
    result:
      "Руководителю не приходится вручную сводить данные, чтобы понять, где требуется внимание.",
  },
];

const steps = [
  {
    title: "Обсуждение задачи",
    body: "За 30 минут разбираемся, как процесс работает сейчас: где возникает ручная работа, кто за нее отвечает, какие данные доступны и что хотелось бы улучшить.",
    result:
      "Рекомендацию следующего шага — проверка концепции или решение пока ничего не автоматизировать.",
  },
  {
    title: "Проверка концепции (Proof of Concept)",
    body: "Описываем текущий процесс и исходные показатели, смотрим примеры данных и определяем, как будем оценивать качество. Затем собираем прототип и проверяем его на ограниченной выборке.",
    result:
      "Границы решения, работающий прототип, отчет о качестве и предварительный расчет расходов на эксплуатацию.",
  },
  {
    title: "Ограниченный пилот",
    body: "Пропускаем через решение часть реального потока: один тип документов, один канал или одно подразделение. Сотрудник проверяет спорные случаи, а текущий порядок работы остается запасным вариантом. Измеряем качество, скорость, количество ручных операций и расходы.",
    result:
      "Результаты на реальных данных, уточненный расчет расходов и решение, стоит ли переходить к внедрению.",
  },
  {
    title: "Внедрение и поддержка",
    body: "Переводим успешный пилот в постоянную работу на согласованном объеме. Настраиваем доступы, контроль качества и порядок поддержки. После запуска следим за работой решения, исправляем ошибки и обновляем правила.",
    result:
      "Работающее решение с понятными зонами ответственности и порядком поддержки.",
  },
];

const faqs = [
  [
    "С какой задачи лучше начать?",
    "Лучше начать с ручной работы, которая регулярно повторяется и отнимает заметное время. При этом должно быть понятно, по каким правилам ее выполняют и сколько она стоит бизнесу.",
  ],
  [
    "Вы сразу предлагаете разработку?",
    "Нет. Сначала нужно понять, есть ли в задаче место для ИИ и даст ли он практическую пользу. После обсуждения мы можем предложить диагностику, проверку концепции или вовсе отказаться от ИИ, если он здесь не нужен.",
  ],
  [
    "Можно ли начать без интеграций?",
    "Да. Для первой проверки обычно хватает небольшой выгрузки данных. Подключаться к рабочим системам имеет смысл позже, во время пилота, когда уже понятно, что решение справляется с задачей.",
  ],
  [
    "Что будет с конфиденциальными и персональными данными?",
    "До начала работы договариваемся, кто получит доступ к данным, где они будут храниться и нужно ли их обезличить. Отдельно фиксируем, какие модели и внешние системы допустимо использовать. На первую проверку берем минимум данных — только то, без чего нельзя оценить качество решения.",
  ],
  [
    "Может ли ИИ ошибаться?",
    "Да, и это нужно учитывать с самого начала. Мы проверяем качество на заранее согласованных примерах. Критичные данные контролируем отдельно, а спорные и рискованные случаи передаем человеку. До запуска также определяем, что система может делать сама, а где без сотрудника обойтись нельзя.",
  ],
  [
    "Что, если пилот не покажет эффект?",
    "Масштабировать такой проект мы не предложим. Сначала разберемся, что помешало получить результат. Иногда достаточно улучшить данные или сузить задачу. В других случаях разумнее остановить проект. Отрицательный результат пилота тоже полезен: он позволяет не вкладываться в решение, которое не окупится.",
  ],
  [
    "Нужно ли менять привычные системы компании?",
    "Не обязательно. По возможности мы встраиваем решение в привычные инструменты: почту, CRM, мессенджеры, таблицы, 1С, ERP или внутреннюю систему компании.",
  ],
];

function DirectLinks({ compact = false }: { compact?: boolean }) {
  return (
    <p className={compact ? "direct direct--compact" : "direct"}>
      {!compact && <span>Или напишите напрямую: </span>}
      <a href={telegram} target="_blank" rel="noreferrer">Telegram</a>
      <i>·</i>
      <a href={maxLink} target="_blank" rel="noreferrer">MAX</a>
      <i>·</i>
      <a href={email}>dmitry@ivanov.works</a>
    </p>
  );
}

const analyticsConsentKey = "analytics-cookie-consent";
const analyticsConsentEvent = "analytics-consent-change";

function subscribeToAnalyticsConsent(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(analyticsConsentEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(analyticsConsentEvent, onChange);
  };
}

function getAnalyticsConsent() {
  try {
    return localStorage.getItem(analyticsConsentKey) === "ok";
  } catch {
    return false;
  }
}

function subscribeToClientReady() {
  return () => {};
}

function CookieNotice({ enabled }: { enabled: boolean }) {
  const clientReady = useSyncExternalStore(
    subscribeToClientReady,
    () => true,
    () => false,
  );
  const accepted = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getAnalyticsConsent,
    () => false,
  );
  if (!enabled || !clientReady || accepted) return null;
  return (
    <aside className="cookie-notice" aria-label="Уведомление о cookie">
      <p>
        Мы используем cookies и Яндекс.Метрику для работы сайта и аналитики.
        Продолжая использовать сайт, вы принимаете{" "}
        <a href="/privacy">условия обработки персональных данных</a>
      </p>
      <button className="button button--primary" onClick={() => {
        localStorage.setItem(analyticsConsentKey, "ok");
        window.dispatchEvent(new Event(analyticsConsentEvent));
      }}>OK</button>
    </aside>
  );
}

function Menu({
  open,
  onClose,
  onForm,
}: {
  open: boolean;
  onClose: () => void;
  onForm: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add("locked");
    panel.current?.querySelector<HTMLButtonElement>(".menu-close")?.focus();
    const key = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const items = Array.from(
          panel.current.querySelectorAll<HTMLElement>("a,button"),
        );
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.classList.remove("locked");
      previous?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  const navigate = () => onClose();
  return (
    <div className="menu-panel" role="dialog" aria-modal="true" aria-label="Меню" ref={panel}>
      <div className="menu-top">
        <img src="/brand/ivanov-ai-logo-inv.svg" alt="ИИ-студия Дмитрия Иванова" />
        <button className="icon-button menu-close" onClick={onClose} aria-label="Закрыть меню">×</button>
      </div>
      <nav className="menu-nav">
        <a href="#solutions" onClick={navigate}>Решения</a>
        <a href="#process" onClick={navigate}>Как работаем</a>
        <a href="#about" onClick={navigate}>О студии</a>
        <a href="#faq" onClick={navigate}>Ответы на вопросы</a>
      </nav>
      <button className="button button--primary menu-cta" onClick={() => { onClose(); onForm(); }}>
        Обсудить процесс
      </button>
      <div className="menu-links">
        <a href={telegram} target="_blank" rel="noreferrer">Telegram <span>↗</span></a>
        <a href={maxLink} target="_blank" rel="noreferrer">MAX <span>↗</span></a>
        <a href={email}>dmitry@ivanov.works <span>↗</span></a>
      </div>
    </div>
  );
}

type FormStatus = "form" | "sending" | "success" | "error";

function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<FormStatus>("form");
  const [confirmClose, setConfirmClose] = useState(false);
  const dirty = Boolean(name || contact || company || message || consent);
  const stateRef = useRef({ dirty, confirmClose, status });
  const onCloseRef = useRef(onClose);
  const clearError = (field: string) =>
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });

  const resetForm = () => {
    setName("");
    setContact("");
    setCompany("");
    setMessage("");
    setConsent(false);
    setErrors({});
    setStatus("form");
    setConfirmClose(false);
  };

  const discardAndClose = () => {
    resetForm();
    onCloseRef.current();
  };

  const closeRequest = () => {
    const current = stateRef.current;
    if (current.status === "success") discardAndClose();
    else if (!current.dirty) {
      setConfirmClose(false);
      onCloseRef.current();
    } else setConfirmClose(true);
  };
  const closeRequestRef = useRef(closeRequest);

  useEffect(() => {
    stateRef.current = { dirty, confirmClose, status };
    onCloseRef.current = onClose;
    closeRequestRef.current = closeRequest;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add("locked");
    requestAnimationFrame(() =>
      dialog.current?.querySelector<HTMLElement>("button,input")?.focus(),
    );
    const key = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (stateRef.current.confirmClose) setConfirmClose(false);
        else closeRequestRef.current();
      }
      if (e.key === "Tab" && dialog.current) {
        const items = Array.from(
          dialog.current.querySelectorAll<HTMLElement>(
            "button:not([disabled]),a,input,textarea",
          ),
        ).filter((el) => !el.hasAttribute("disabled"));
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.classList.remove("locked");
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Укажите имя";
    if (
      !contact.trim() ||
      (!contact.includes("@") && !contact.startsWith("@") && !contact.startsWith("t.me/"))
    )
      next.contact = "Укажите корректный контакт";
    if (!consent)
      next.consent = "Нужно согласие на обработку персональных данных";
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        dialog.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
      );
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, company, message }),
      });
      if (!response.ok) throw new Error("Contact request failed");
      reachGoal("IW_FEEDBACK_SEND");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeRequest()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={dialog}>
        <div className="modal-bar">
          <img src="/brand/ivanov-ai-logo.svg" alt="" />
          <h2 id="modal-title">{status === "form" || status === "sending" ? "Обсудить процесс" : ""}</h2>
          <button className="icon-button modal-close" onClick={closeRequest} aria-label="Закрыть">×</button>
        </div>
        {status === "success" ? (
          <div className="result-state">
            <span className="result-icon result-icon--success">✓</span>
            <h2>Спасибо, заявка отправлена</h2>
            <p>Мы свяжемся с вами в ближайшее время, по указанному адресу</p>
            <DirectLinks compact />
          </div>
        ) : status === "error" ? (
          <div className="result-state">
            <span className="result-icon result-icon--error">!</span>
            <h2>Не получилось отправить заявку</h2>
            <p>Проверьте соединение и попробуйте ещё раз. Если ошибка повторится, напишите напрямую.</p>
            <button className="button button--primary button--wide" onClick={() => setStatus("form")}>
              Попробовать ещё раз
            </button>
            <p className="direct"><a href={telegram}>Telegram</a> · <a href={maxLink}>MAX</a> · <a href={email}>dmitry@ivanov.works</a></p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="contact-form">
            <p className="modal-lead">Оставьте контакты, мы свяжемся с вами в ближайшее время</p>
            <label>
              <span>Ваше имя <b>*</b></span>
              <input placeholder="Дмитрий Иванов" value={name} onChange={(e) => { setName(e.target.value); clearError("name"); }} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />
              {errors.name && <small className="field-error" id="name-error">ⓘ {errors.name}</small>}
            </label>
            <label>
              <span>Email или Telegram <b>*</b></span>
              <input placeholder="@dmitrio или dmitry@example.com" value={contact} onChange={(e) => { setContact(e.target.value); clearError("contact"); }} aria-invalid={Boolean(errors.contact)} aria-describedby={errors.contact ? "contact-error" : undefined} />
              {errors.contact && <small className="field-error" id="contact-error">ⓘ {errors.contact}</small>}
            </label>
            <label>
              <span>Компания</span>
              <input placeholder="Название компании" value={company} onChange={(e) => setCompany(e.target.value)} />
            </label>
            <label>
              <span>Сообщение</span>
              <textarea placeholder="Коротко опишите процесс и где возникает ручная работа" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            </label>
            <label className="check-row">
              <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); clearError("consent"); }} aria-invalid={Boolean(errors.consent)} />
              <span>Я соглашаюсь на обработку персональных данных и принимаю <a href="/privacy" target="_blank">Политику обработки персональных данных</a>.</span>
            </label>
            {errors.consent && <small className="field-error consent-error">ⓘ {errors.consent}</small>}
            <button className="button button--primary button--wide" disabled={status === "sending"}>
              {status === "sending" && <span className="spinner" aria-hidden="true" />}
              {status === "sending" ? "Отправляем…" : "Отправить заявку"}
            </button>
            <DirectLinks />
          </form>
        )}
        {confirmClose && (
          <div className="confirm-layer" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
            <div className="confirm-card">
              <span className="warning">!</span>
              <h3 id="confirm-title">Закрыть без отправки?</h3>
              <p>Введённые данные не сохранятся.</p>
              <div className="confirm-actions">
                <button className="button button--outline" onClick={() => setConfirmClose(false)}>Продолжить заполнение</button>
                <button className="button button--primary" onClick={discardAndClose}>Закрыть без отправки</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [openSolution, setOpenSolution] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [modal, setModal] = useState(false);
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState("");
  const [compactHeader, setCompactHeader] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompactHeader(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const sections = ["solutions", "process", "about", "faq"]
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const openForm = () => {
    reachGoal("IW_FEEDBACK_OPEN");
    setModal(true);
  };
  return (
    <>
      <header className={`site-header ${compactHeader ? "site-header--compact" : ""}`}>
        <a href="#top" className="brand-link" aria-label="На главную">
          <img className="brand-full" src="/brand/ivanov-ai-logo-inv.svg" alt="ИИ-студия Дмитрия Иванова" />
          <img className="brand-sign" src="/brand/ivanov-ai-sign-inv.svg" alt="" />
        </a>
        <nav className="desktop-nav" aria-label="Основная навигация">
          <a className={active === "solutions" ? "active" : ""} href="#solutions">Решения</a>
          <a className={active === "process" ? "active" : ""} href="#process">Как работаем</a>
          <a className={active === "about" ? "active" : ""} href="#about">О студии</a>
          <a className={active === "faq" ? "active" : ""} href="#faq">Ответы на вопросы</a>
        </nav>
        <button className="button button--primary header-cta" onClick={openForm}>Обсудить процесс</button>
        <button className="icon-button mobile-menu-button" onClick={() => setMenu(true)} aria-label="Открыть меню"><span /><span /><span /></button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">ПЕРСОНАЛЬНАЯ ИНЖЕНЕРНАЯ ИИ-СТУДИЯ</p>
              <h1>Сокращаем ручную работу в операционных процессах</h1>
              <p className="hero-lead">Берем один процесс, проверяем ИИ-решение на ваших данных и внедряем его, только если проверка подтверждает качество и экономический смысл.</p>
              <button className="button button--primary hero-cta" onClick={openForm}>Обсудить процесс</button>
              <DirectLinks />
            </div>
            <img className="hero-mark" src="/brand/ivanov-ai-sign-inv.svg" alt="" />
          </div>
          <div className="hero-meta"><span>ПРОЦЕСС</span><span>ДАННЫЕ</span><span>ПРОВЕРКА</span><span>РЕШЕНИЕ</span></div>
        </section>

        <section className="section solutions" id="solutions">
          <div className="container">
            <p className="section-kicker">РЕШЕНИЯ</p>
            <div className="section-heading-row">
              <h2>Где можно сократить ручную работу</h2>
              <p>Система обрабатывает типовой поток. Сотруднику передаёт случаи, где нужна проверка или решение.</p>
            </div>
            <div className="solutions-list">
              {solutions.map((item, index) => {
                const isOpen = index === openSolution;
                return (
                  <article className={`solution ${isOpen ? "solution--open" : ""}`} key={item.title}>
                    <button className="solution-head" onClick={() => setOpenSolution(index)} aria-expanded={isOpen}>
                      <span>{item.title}</span>
                      <i aria-hidden="true">{isOpen ? "−" : "+"}</i>
                    </button>
                    {isOpen && (
                      <div className="solution-body">
                        <div className="solution-column">
                          <span className="solution-icon" aria-hidden="true">▤</span>
                          <strong>Вход</strong>
                          <p>{item.input}</p>
                        </div>
                        <div className="solution-column">
                          <span className="solution-icon" aria-hidden="true">▦</span>
                          <strong>Что делает система</strong>
                          <p>{item.system}</p>
                        </div>
                        <div className="solution-column">
                          <span className="solution-icon" aria-hidden="true">♙</span>
                          <strong>Сотруднику</strong>
                          <p>{item.employee}</p>
                        </div>
                        <div className="solution-column">
                          <span className="solution-icon" aria-hidden="true">◇</span>
                          <strong>Результат</strong>
                          <p>{item.result}</p>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
            <button className="button button--primary section-cta" onClick={openForm}>Обсудить процесс</button>
          </div>
        </section>

        <section className="section process" id="process">
          <div className="container">
            <p className="section-kicker">ПРОЦЕСС</p>
            <div className="section-heading-row">
              <h2>Как мы работаем</h2>
              <p>Начинаем с одного процесса. После каждого этапа решаем, есть ли смысл двигаться дальше.</p>
            </div>
            <div className="timeline">
              {steps.map((step, index) => (
                <div className="timeline-item" key={step.title}>
                  <div className="timeline-number">{index + 1}</div>
                  <div className="timeline-content">
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                    <div className="deliverable"><span>Что получаете</span>{step.result}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="button button--primary section-cta" onClick={openForm}>Обсудить процесс</button>
          </div>
        </section>

        <section className="section about" id="about">
          <div className="container">
            <p className="section-kicker">О СТУДИИ</p>
            <div className="about-grid">
              <div>
                <h2>Лично веду проект от первого обсуждения до запуска</h2>
                <div className="about-copy">
                  <p>Меня зовут Дмитрий Иванов, я основатель студии. С 2007 года я создаю цифровые продукты и автоматизирую бизнес-процессы.</p>
                  <p>Запускал веб- и B2B-сервисы, разрабатывал внутренние ERP-системы, интеграции с CRM и ресторанными платформами. Занимался управленческой отчетностью и автоматизацией доставки. Основал и технически руководил фудтех-стартапом Smartofood.</p>
                  <p>За эти годы я понял простую вещь: технология сама по себе редко решает бизнес-задачу. Можно собрать убедительный прототип, но пользы от него не будет, если он не учитывает реальный процесс, данные, экономику и ограничения компании.</p>
                  <p>На этом принципе строится работа студии. Мы начинаем каждый проект с конкретного бизнес-процесса: разбираемся, где компания теряет время и деньги, где возникают ошибки и какой результат должно дать внедрение.</p>
                  <p>Я лично веду проект от первого обсуждения до запуска и отвечаю за его реализацию. Для меня результат — это работающий инструмент, которым пользуются сотрудники и который приносит бизнесу измеримую пользу.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section faq" id="faq">
          <div className="container">
            <p className="section-kicker">FAQ</p>
            <h2>Ответы на вопросы</h2>
            <div className="faq-list">
              {faqs.map(([question, answer], index) => {
                const isOpen = openFaq === index;
                return (
                  <div className="faq-item" key={question}>
                    <button onClick={() => setOpenFaq(isOpen ? null : index)} aria-expanded={isOpen}>
                      <span>{question}</span><i>{isOpen ? "−" : "+"}</i>
                    </button>
                    {isOpen && <div className="faq-answer"><p>{answer}</p></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="container final-grid">
            <div>
              <p className="section-kicker section-kicker--dark">СЛЕДУЮЩИЙ ШАГ</p>
              <h2>Разберем ваш процесс и поймем, есть ли в нем задача для ИИ</h2>
              <button className="button button--primary" onClick={openForm}>Обсудить процесс</button>
              <DirectLinks />
            </div>
            <img className="hero-mark hero-mark--small" src="/brand/ivanov-ai-sign-inv.svg" alt="" />
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-grid">
          <div><img src="/brand/ivanov-ai-logo-black.svg" alt="ИИ-студия Дмитрия Иванова" /><p>© ИИ-студия Дмитрия Иванова</p></div>
          <nav><a href="#solutions">Решения</a><a href="#process">Как работаем</a><a href="#about">О студии</a><a href="#faq">Ответы на вопросы</a></nav>
          <nav><a href={telegram}>Telegram</a><a href={maxLink}>MAX</a><a href={email}>dmitry@ivanov.works</a><a href="/privacy">Политика обработки персональных данных</a></nav>
        </div>
      </footer>
      <Menu open={menu} onClose={() => setMenu(false)} onForm={openForm} />
      <ContactModal open={modal} onClose={() => setModal(false)} />
      <CookieNotice enabled />
    </>
  );
}
