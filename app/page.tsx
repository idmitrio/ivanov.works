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
      id: number,
      method: string,
      goalOrOptions?: string | Record<string, unknown>,
    ) => void;
  }
}

function reachGoal(goal: "IW_FEEDBACK_OPEN" | "IW_FEEDBACK_SEND") {
  window.ym?.(yandexMetrikaId, "reachGoal", goal);
}

const solutions = [
  {
    title: "Проверка документов",
    input: "Например, счет и накладную нужно сверить с заказом, а данные из скана — перенести в учетную систему.",
    system:
      "ИИ извлекает реквизиты и позиции. Система сверяет их с заказом и данными в 1С или ERP, отмечает расхождения и недостающие документы. Сотрудник проверяет спорные места и подтверждает результат.",
    result: "Документы проверены, расхождения отмечены",
  },
  {
    title: "Заявки и коммерческие предложения",
    input: "Например, клиент присылает запрос в письме, а перечень товаров или услуг прикладывает в PDF или Excel.",
    system:
      "ИИ разбирает заявку. Система сопоставляет позиции с каталогом, берет цены из учетной системы и готовит черновик предложения. Сотрудник проверяет состав предложения, согласует условия и отправляет КП клиенту.",
    result: "От заявки к черновику КП без ручного переноса данных",
  },
  {
    title: "Обращения клиентов",
    input: "Например, клиент обращается с вопросом по заказу, а сотрудник ищет переписку и уточняет, что уже было сделано.",
    system:
      "ИИ определяет тему обращения, собирает историю и готовит черновик ответа по регламентам компании. Сотрудник проверяет ответ, а сложные вопросы получает профильный специалист.",
    result: "Ответ клиенту с учетом истории обращения",
  },
  {
    title: "Поиск по документации",
    input: "Например, сотруднику нужно найти условия в договоре, порядок работы в регламенте или нужный пункт инструкции.",
    system:
      "Помощник ищет в согласованной базе документов и показывает ответ со ссылкой на нужный фрагмент. Если данных нет или источники противоречат друг другу, сообщает об этом. Сотрудник проверяет применимость ответа к своей задаче.",
    result: "Нужный пункт инструкции — вместе с источником",
  },
  {
    title: "Отчеты и отклонения",
    input: "Например, ежедневная сводка по заказам, просроченным заявкам или задержкам поставок.",
    system:
      "Система собирает показатели из таблиц и рабочих систем, сравнивает их по заданным правилам. ИИ сводит текстовые комментарии. Руководитель получает отчет со ссылками на исходные данные и решает, какие отклонения требуют действий.",
    result: "Сводка готова без ручного сбора из разных источников",
  },
];

const steps = [
  {
    title: "Обсуждение задачи",
    body: "За 30 минут обсудим, какую работу команда делает вручную и что хочется улучшить. Для разговора достаточно описать процесс своими словами. Документы и доступы не нужны.",
    result:
      "Рекомендацию, что делать дальше: подробнее разобрать задачу, проверить идею или пока оставить процесс как есть.",
  },
  {
    title: "Проверка идеи на данных",
    body: "Выберем примеры ваших документов или заявок и договоримся, какой результат считаем приемлемым. Соберем прототип и проверим, справляется ли он с задачей.",
    result:
      "Прототип и разбор его результатов: что получилось, где он ошибается и какие расходы ожидаются при использовании.",
  },
  {
    title: "Пробный запуск",
    body: "Проверим решение в ежедневной работе на одном участке, например на одном типе документов. Учтем время на ручную проверку и сравним результат с прежним процессом. На случай сбоя сохраним возможность работать привычным способом.",
    result:
      "Данные о качестве, затратах времени и расходах. Вместе решим, стоит ли переходить к постоянному использованию.",
  },
  {
    title: "Внедрение и поддержка",
    body: "После успешного пробного запуска подключим согласованный объем работы. Покажем сотрудникам, как пользоваться решением и проверять результат. Договоримся о поддержке: кто следит за работой системы и исправляет ошибки.",
    result:
      "Решение в ежедневной работе, инструкции для сотрудников и согласованный порядок поддержки.",
  },
];

const faqs = [
  [
    "С какой задачи лучше начать?",
    "С работы, которая регулярно повторяется и отнимает время у команды. Например, сотрудники переносят данные из счетов, разбирают заявки или собирают отчеты вручную. На первом разговоре обсудим вашу задачу и возможные способы ее упростить.",
  ],
  [
    "Что будет после первого разговора и сколько это стоит?",
    "Первый разговор занимает 30 минут и бесплатен. Если увидим подходящую задачу, предложим следующий шаг: подробнее разобрать процесс или проверить решение на примерах ваших данных. Эти работы оплачиваются отдельно. Их состав и стоимость согласуем до начала. Обязательств продолжать после разговора нет.",
  ],
  [
    "Нужно сразу давать доступ к нашим системам?",
    "Для первого разговора документы и доступы не нужны. Для проверки идеи часто достаточно нескольких файлов или выгрузки данных. Какие примеры понадобятся и как их передать, согласуем отдельно. Подключение к рабочим системам обсуждаем, когда оно нужно для следующего этапа.",
  ],
  [
    "Придется менять программы и работу сотрудников?",
    "Сначала смотрим, как встроить решение в ваши инструменты: например, почту, 1С или CRM. Иногда нужно изменить отдельные действия сотрудников. Заранее договоримся, что делает система, кто проверяет результат и как продолжать работу, если она недоступна.",
  ],
  [
    "Кто получит доступ к нашим данным?",
    "До передачи данных согласуем, кто сможет их видеть, где они будут храниться и какие внешние сервисы можно использовать. Если сведения нужно обезличить, определим это заранее. Для проверки берем только те данные, которые нужны для задачи.",
  ],
  [
    "Что, если ИИ ошибется?",
    "ИИ может неверно прочитать документ или подготовить неточный ответ. Поэтому до запуска проверяем решение на согласованных примерах и определяем, какие результаты должен подтверждать сотрудник. Например, система может подготовить платежные реквизиты, но их проверку перед оплатой оставляем человеку.",
  ],
  [
    "Как понять, что внедрение окупается?",
    "Сравним затраты на процесс до и после внедрения, включая проверку результатов и работу самого решения. Освободившееся время не всегда означает экономию денег. Поэтому заранее обсудим, как его использовать: например, обрабатывать больше заказов тем же составом команды или сократить переработки.",
  ],
  [
    "Что, если пробный запуск не даст результата?",
    "Если пилот не дал нужного результата, переходить к полному внедрению не будем. Разберемся, что помешало: качество данных, слишком широкая задача или само решение. По итогам предложим доработку либо остановку проекта. Следующий этап начинается только после согласования с вами.",
  ],
  [
    "Вы делаете ИИ-агентов или помощников?",
    "Зависит от задачи. Помощник может готовить ответ или документ для сотрудника. Агент может выполнять несколько шагов в рабочих системах, например разобрать заявку и создать карточку заказа. Выбираем подходящий вариант после разбора процесса. Иногда достаточно автоматизации без ИИ.",
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
    <aside className="cookie-notice" aria-label="Уведомление о cookie">
      <p>
        Мы используем cookies и Яндекс.Метрику для работы сайта и аналитики.
        Продолжая использовать сайт, вы принимаете{" "}
        <a href="/privacy">условия обработки персональных данных</a>
      </p>
      <button className="button button--primary" onClick={() => {
        localStorage.setItem(analyticsConsentKey, "ok");
        window.dispatchEvent(new Event(analyticsConsentEvent));
      }}>OK</button>
    </aside>
  );
}

function SolutionBenefitPanel({
  item,
  className = "",
  id,
  hidden = false,
}: {
  item: (typeof solutions)[number];
  className?: string;
  id?: string;
  hidden?: boolean;
}) {
  return (
    <div
      className={`solution-benefit-panel ${className}`}
      id={id}
      hidden={hidden}
    >
      <div className="solution-benefit-main">
        <span>Что получит ваша команда</span>
        <h3>{item.result}</h3>
        <p>{item.input}</p>
      </div>
      <div className="solution-benefit-proof">
        <strong>За счет чего</strong>
        <p>{item.system}</p>
      </div>
    </div>
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
        <a href="#about" onClick={navigate}>О студии</a>
        <a href="#faq" onClick={navigate}>Ответы на вопросы</a>
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
    if (!contact.trim()) next.contact = "Укажите корректный контакт";
    if (!consent)
      next.consent = "Нужно согласие на обработку персональных данных";
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
        body: JSON.stringify({ name, contact, company, message, consent }),
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
            <p>Мы свяжемся с вами по указанному контакту и согласуем время разговора.</p>
            <DirectLinks compact />
          </div>
        ) : status === "error" ? (
          <div className="result-state">
            <span className="result-icon result-icon--error">!</span>
            <h2>Не получилось отправить заявку</h2>
            <p>Проверьте соединение и попробуйте еще раз. Если ошибка повторится, напишите напрямую.</p>
            <button className="button button--primary button--wide" onClick={() => setStatus("form")}>
              Попробовать еще раз
            </button>
            <p className="direct"><a href={telegram}>Telegram</a> · <a href={maxLink}>MAX</a> · <a href={email}>dmitry@ivanov.works</a></p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="contact-form">
            <p className="modal-lead">Оставьте контакт — согласуем время бесплатного 30-минутного разговора. Документы и доступы для первой встречи не нужны.</p>
            <label>
              <span>Ваше имя <b>*</b></span>
              <input placeholder="Константин Константинопольский" value={name} onChange={(e) => { setName(e.target.value); clearError("name"); }} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />
              {errors.name && <small className="field-error" id="name-error">ⓘ {errors.name}</small>}
            </label>
            <label>
              <span>Email или телефон <b>*</b></span>
              <input placeholder="kostya@konstantinopolis.ru или +7 999 123-45-67" value={contact} onChange={(e) => { setContact(e.target.value); clearError("contact"); }} aria-invalid={Boolean(errors.contact)} aria-describedby={errors.contact ? "contact-error" : undefined} />
              {errors.contact && <small className="field-error" id="contact-error">ⓘ {errors.contact}</small>}
            </label>
            <label>
              <span>Компания</span>
              <input placeholder="ООО «Константа»" value={company} onChange={(e) => setCompany(e.target.value)} />
            </label>
            <label>
              <span>Какую ручную работу хотите обсудить?</span>
              <textarea placeholder="Необязательно. Например: вручную переносим данные из счетов в 1С" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            </label>
            <label className="check-row">
              <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); clearError("consent"); }} aria-invalid={Boolean(errors.consent)} />
              <span>Я соглашаюсь на обработку персональных данных и принимаю <a href="/privacy" target="_blank">Политику обработки персональных данных</a>.</span>
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
              <p>Введенные данные не сохранятся.</p>
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
        <a href="#top" className="brand-link" aria-label="На главную">
          <img className="brand-full" src="/brand/ivanov-ai-logo-inv.svg" alt="ИИ-студия Дмитрия Иванова" />
          <img className="brand-sign" src="/brand/ivanov-ai-sign-inv.svg" alt="" />
        </a>
        <nav className="desktop-nav" aria-label="Основная навигация">
          <a className={active === "solutions" ? "active" : ""} href="#solutions">Решения</a>
          <a className={active === "process" ? "active" : ""} href="#process">Как работаем</a>
          <a className={active === "about" ? "active" : ""} href="#about">О студии</a>
          <a className={active === "faq" ? "active" : ""} href="#faq">Ответы на вопросы</a>
          <a href="#contacts">Контакты</a>
        </nav>
        <button className="button button--primary header-cta" onClick={openForm}>Обсудить процесс</button>
        <button className="icon-button mobile-menu-button" onClick={() => setMenu(true)} aria-label="Открыть меню"><span /><span /><span /></button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">РАЗРАБОТКА И ВНЕДРЕНИЕ ИИ-РЕШЕНИЙ</p>
              <h1>Сокращаем ручную работу в процессах компании</h1>
              <p className="hero-lead">За 30 минут разберем вашу задачу и обсудим, стоит ли ее автоматизировать.</p>
              <div className="hero-actions">
                <button className="button button--primary hero-cta" onClick={openForm}>Обсудить процесс</button>
                <p className="hero-meeting-terms">30 минут · Бесплатно · Без обязательств</p>
              </div>
              <DirectLinks />
            </div>
            <img className="hero-mark" src="/brand/ivanov-ai-sign-inv.svg" alt="" />
          </div>
        </section>

        <section className="section solutions" id="solutions">
          <div className="container">
            <p className="section-kicker">РЕШЕНИЯ</p>
            <div className="section-heading-row">
              <h2>Где можно сократить ручную работу</h2>
              <p>Примеры задач в документообороте, продажах и сервисе.</p>
            </div>
            <div className="solutions-benefit-list" aria-label="Сценарии автоматизации">
              {solutions.map((item, index) => {
                const isOpen = index === openSolution;
                const panelId = `solution-panel-${index}`;
                return (
                  <article className={isOpen ? "active" : ""} key={item.title}>
                    <button
                      className="solution-benefit-head"
                      onClick={() => setOpenSolution(index)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                    >
                      <span>{item.title}</span>
                      <i aria-hidden="true">
                        <span className="solution-arrow">→</span>
                        <span className="solution-toggle">{isOpen ? "−" : "+"}</span>
                      </i>
                    </button>
                    <SolutionBenefitPanel
                      item={item}
                      id={panelId}
                      hidden={!isOpen}
                    />
                  </article>
                );
              })}
            </div>

            <section className="meeting" aria-labelledby="meeting-title">
              <div className="meeting-layout">
                <div className="meeting-duration">
                  <p className="section-kicker">ПЕРВЫЙ РАЗГОВОР</p>
                  <p className="meeting-time">30 минут</p>
                  <p className="meeting-terms">Бесплатно · Без обязательств</p>
                </div>
                <div className="meeting-summary">
                  <h2 id="meeting-title">Начнем с одного процесса</h2>
                  <p>Вы расскажете, где команда тратит время на ручную работу. Мы обсудим, что можно автоматизировать и что проверить дальше.</p>
                  <p className="meeting-preparation">Документы и доступы для разговора не нужны.</p>
                  <p className="meeting-next">Дальнейшие работы оплачиваются отдельно. Состав и стоимость согласуем заранее.</p>
                </div>
              </div>
            </section>
            <button className="button button--primary section-cta" onClick={openForm}>Обсудить процесс</button>
          </div>
        </section>

        <section className="section case-feature" id="smartofood-case" aria-labelledby="case-feature-title">
          <div className="container">
            <p className="section-kicker">КЕЙС · SMARTOFOOD</p>
            <h2 id="case-feature-title">ИИ-агент для публикации мобильных приложений</h2>
            <p className="case-feature-context">Smartofood — фудтех-стартап основателя студии.</p>
            <div className="case-feature-grid">
              <div className="case-feature-story">
                <h3>Раньше</h3>
                <p>На каждое приложение клиента уходил час ручной работы. Очередь росла, и клиенты неделю ждали отправки приложения в магазины.</p>
                <h3>Что изменили</h3>
                <p>Агент проверяет данные из анкеты, собирает приложения и отправляет их в RuStore, Google Play и App Store. После успешной публикации добавляет ссылки на сайт клиента.</p>
              </div>
              <div className="case-feature-result">
                <p className="case-feature-result-label">Ручная работа на одно приложение</p>
                <p className="case-feature-metric"><span>1 час</span><span aria-hidden="true">→</span><strong>5 мин</strong></p>
                <p>Сотрудник заполняет данные. Агент ведет публикации автоматически каждый день.</p>
              </div>
            </div>
            <details className="case-feature-details">
              <summary>Как работает агент<span aria-hidden="true">+</span></summary>
              <ol className="case-feature-flow">
                <li><span>01</span><strong>Проверяет анкету</strong><p>Получает данные, которые заполнил сотрудник.</p></li>
                <li><span>02</span><strong>Собирает приложения</strong><p>Готовит приложения клиента к отправке в магазины.</p></li>
                <li><span>03</span><strong>Ведет публикации</strong><p>Отправляет приложения в RuStore, Google Play и App Store.</p></li>
                <li><span>04</span><strong>Добавляет ссылки</strong><p>Размещает ссылки на сайте клиента после успешной публикации.</p></li>
              </ol>
            </details>
          </div>
        </section>

        <section className="section process" id="process">
          <div className="container">
            <p className="section-kicker">ПРОЦЕСС</p>
            <div className="section-heading-row">
              <h2>Как мы работаем</h2>
              <p>Состав и стоимость каждого платного этапа согласуем до начала работ.</p>
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
            <p className="section-kicker">О СТУДИИ</p>
            <h2 className="about-title">От первого разговора до запуска</h2>
            <div className="about-grid">
              <div>
                <div className="about-copy">
                  <p>Меня зовут Дмитрий Иванов, я основатель студии. С 2007 года создаю цифровые продукты и автоматизирую бизнес-процессы.</p>
                  <p>Разрабатывал ERP-системы, интеграции с CRM и ресторанными платформами. Основал и технически руководил фудтех-стартапом Smartofood.</p>
                  <p>Сначала вместе с вашей командой разбираемся, какую ручную работу стоит автоматизировать. Затем я веду разработку и отвечаю за запуск решения.</p>
                </div>
                <a className="presentation-link" href="/ivanov-ai-presentation.pdf" download>
                  <span className="presentation-label">Скачать презентацию</span>
                  <span className="presentation-icon" aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section faq" id="faq">
          <div className="container">
            <p className="section-kicker">FAQ</p>
            <h2>Ответы на вопросы</h2>
            <div className="faq-list">
              {faqs.map(([question, answer], index) => {
                const isOpen = openFaq === index;
                return (
                  <div className="faq-item" key={question}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                    >
                      <span>{question}</span><i>{isOpen ? "−" : "+"}</i>
                    </button>
                    <div
                      className="faq-answer"
                      id={`faq-answer-${index}`}
                      hidden={!isOpen}
                    >
                      <p>{answer}</p>
                    </div>
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
              <h2>С какой задачи начнем?</h2>
              <p className="final-cta-lead">Расскажите, какую ручную работу хотите упростить. Начнем с бесплатного 30-минутного разговора.</p>
              <button className="button button--primary" onClick={openForm}>Обсудить процесс</button>
              <DirectLinks />
            </div>
            <img className="hero-mark hero-mark--small" src="/brand/ivanov-ai-sign-inv.svg" alt="" />
          </div>
        </section>
      </main>

      <footer id="contacts">
        <div className="container footer-grid">
          <div><img src="/brand/ivanov-ai-logo-black.svg" alt="ИИ-студия Дмитрия Иванова" /><p>© ИИ-студия Дмитрия Иванова</p></div>
          <nav><a href="#solutions">Решения</a><a href="#process">Как работаем</a><a href="#about">О студии</a><a href="#faq">Ответы на вопросы</a></nav>
          <nav><a href={telegram}>Telegram</a><a href={maxLink}>MAX</a><a href={email}>dmitry@ivanov.works</a><a href="/privacy">Политика обработки персональных данных</a></nav>
        </div>
      </footer>
      <Menu open={menu} onClose={() => setMenu(false)} onForm={openForm} />
      <ContactModal open={modal} onClose={() => setModal(false)} />
      <CookieNotice enabled />
    </>
  );
}
