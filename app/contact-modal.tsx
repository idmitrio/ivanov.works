"use client";

import {
  createContext,
  FormEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const telegram = "https://t.me/dmitrio";
const maxLink =
  "https://max.ru/u/f9LHodD0cOIl7MPfiO0OlgTYfDEeoMc8C2UPsPUluf-6LFlEINKfwLu4-O0";
const email = "mailto:dmitry@ivanov.works";
const yandexMetrikaId = 109276483;

type ContactModalContextValue = {
  openContactModal: () => void;
};

const ContactModalContext = createContext<ContactModalContextValue | null>(null);

function reachGoal(goal: "IW_FEEDBACK_OPEN" | "IW_FEEDBACK_SEND") {
  window.ym?.(yandexMetrikaId, "reachGoal", goal);
}

export function ContactModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openContactModal = useCallback(() => {
    reachGoal("IW_FEEDBACK_OPEN");
    setOpen(true);
  }, []);

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash !== "#contact") return;
      openContactModal();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [openContactModal]);

  return (
    <ContactModalContext.Provider value={{ openContactModal }}>
      {children}
      <ContactModal open={open} onClose={() => setOpen(false)} />
    </ContactModalContext.Provider>
  );
}

export function useContactModal() {
  const context = useContext(ContactModalContext);
  if (!context) {
    throw new Error("useContactModal must be used inside ContactModalProvider");
  }
  return context;
}

export function ContactButton({
  children = "Обсудить процесс",
  className = "button button--primary",
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { openContactModal } = useContactModal();
  return (
    <button type="button" className={className} onClick={openContactModal}>
      {children}
    </button>
  );
}

export function DirectLinks({ compact = false }: { compact?: boolean }) {
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
