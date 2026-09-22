"use client";


import {
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import SiteHeader from "./site-header";
import { useContactModal } from "./contact-modal";
import { withNbsp } from "./typography";

const telegram = "https://t.me/dmitrio";
const maxLink =
  "https://max.ru/u/f9LHodD0cOIl7MPfiO0OlgTYfDEeoMc8C2UPsPUluf-6LFlEINKfwLu4-O0";
const email = "mailto:dmitry@ivanov.works";
const solutions = [
  {
    title: "Проверка документов",
    href: "/solutions/documents",
    input: "Например, счет и накладную нужно сверить с заказом, а данные из скана — перенести в учетную систему.",
    system:
      "Система извлекает реквизиты и позиции, сверяет их с заказом и учетной системой, затем отмечает расхождения. Сотрудник проверяет спорные места и подтверждает результат.",
    result: "Документы проверены, расхождения отмечены",
  },
  {
    title: "Заявки и коммерческие предложения",
    href: "/solutions/requests",
    input: "Например, клиент присылает запрос в письме, а перечень товаров или услуг прикладывает в PDF или Excel.",
    system:
      "Система разбирает заявку, сопоставляет позиции с каталогом и ценами, затем готовит черновик предложения. Менеджер проверяет состав и условия перед отправкой.",
    result: "От заявки к черновику КП без ручного переноса данных",
  },
  {
    title: "Обращения клиентов",
    href: "/solutions/support",
    input: "Например, клиент обращается с вопросом по заказу, а сотрудник ищет переписку и уточняет, что уже было сделано.",
    system:
      "Система определяет тему обращения, собирает историю и готовит ответ по регламентам компании. Сотрудник проверяет ответ, сложные вопросы получает профильный специалист.",
    result: "Ответ клиенту с учетом истории обращения",
  },
  {
    title: "Поиск по документации",
    href: "/solutions/knowledge-base",
    input: "Например, сотруднику нужно найти условия в договоре, порядок работы в регламенте или нужный пункт инструкции.",
    system:
      "Помощник ищет ответ в согласованной базе и показывает нужный фрагмент источника. Если данных недостаточно или они противоречат друг другу, сообщает об этом.",
    result: "Нужный пункт инструкции — вместе с источником",
  },
  {
    title: "Отчеты и отклонения",
    href: "/solutions/reports",
    input: "Например, ежедневная сводка по заказам, просроченным заявкам или задержкам поставок.",
    system:
      "Система собирает показатели, сравнивает их по заданным правилам и сводит комментарии. Руководитель получает отчет со ссылками на исходные данные и список отклонений.",
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
        <h3>{withNbsp(item.result)}</h3>
        <p>{withNbsp(item.input)}</p>
        <a className="solution-benefit-link" href={item.href}>
          <span>Смотреть сценарии</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
      <div className="solution-benefit-proof">
        <strong>За счет чего</strong>
        <p>{withNbsp(item.system)}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [openSolution, setOpenSolution] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [active, setActive] = useState("");
  const { openContactModal: openForm } = useContactModal();

  useEffect(() => {
    const sections = ["solutions", "process", "about", "faq", "contacts"]
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
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <SiteHeader active={active as "solutions" | "process" | "about" | "faq" | "contacts" | ""} home />

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
                      <span>{withNbsp(item.title)}</span>
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

          </div>
        </section>

        <section className="section case-feature" id="smartofood-case" aria-labelledby="case-feature-title">
          <div className="container">
            <p className="section-kicker">КЕЙС SMARTOFOOD</p>
            <h2 id="case-feature-title">ИИ-агент для публикации мобильных приложений</h2>
            <div className="case-feature-grid">
              <div className="case-feature-story">
                <h3>Проблема</h3>
                <p>В Smartofood необходимо постоянно публиковать мобильные приложения клиентов. Ручная работа занимала час на каждое. Очередь росла, и клиенты неделю ждали отправки приложения в магазины.</p>
                <h3>Решение</h3>
                <p>Внедрили ИИ-агента: он проверяет данные из анкеты, собирает приложения, отправляет их в RuStore, Google Play и App Store. После успешной публикации размещает ссылки на сайте клиента.</p>
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
                <li><span>1</span><strong>Проверяет анкету</strong><p>Получает данные, которые заполнил сотрудник.</p></li>
                <li><span>2</span><strong>Собирает приложения</strong><p>Готовит приложения клиента к отправке в магазины.</p></li>
                <li><span>3</span><strong>Контролирует публикацию</strong><p>Отправляет приложения в магазины и контролирует их публикацию.</p></li>
                <li><span>4</span><strong>Добавляет ссылки</strong><p>Размещает ссылки на сайте клиента после успешной публикации.</p></li>
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
                  <p>Вместе с вашей командой определяем, где автоматизация принесет пользу. Я отвечаю за техническое решение, разработку и внедрение.</p>
                </div>
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
      <CookieNotice enabled />
    </>
  );
}
