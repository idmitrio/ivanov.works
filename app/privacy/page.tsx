import Link from "next/link";

const sections = [
  "Общие положения",
  "Цели обработки",
  "Состав данных",
  "Порядок обработки",
  "Права субъекта",
  "Контакты оператора",
];

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <header className="inner-header">
        <Link href="/" aria-label="На главную">
          <img src="/brand/ivanov-ai-logo-black.svg" alt="ИИ-студия Дмитрия Иванова" />
        </Link>
        <Link href="/" className="back-link"><span>←</span> Вернуться на сайт</Link>
      </header>
      <div className="legal-layout">
        <aside className="legal-aside">
          <strong>Содержание</strong>
          <ol>
            {sections.map((section, index) => <li key={section}><a href={`#policy-${index + 1}`}>{section}</a></li>)}
          </ol>
        </aside>
        <article className="legal-content">
          <h1>Политика обработки персональных данных</h1>
          <p className="revision">Дата редакции: [дд.мм.гггг]</p>
          <div className="legal-notice"><span>i</span><strong>Здесь будет размещён утверждённый текст политики.</strong></div>
          <details className="legal-mobile-toc">
            <summary>Содержание</summary>
            <ol>{sections.map((section, index) => <li key={section}><a href={`#policy-${index + 1}`}>{section}</a></li>)}</ol>
          </details>
          {sections.map((section, index) => (
            <section id={`policy-${index + 1}`} key={section}>
              <h2>{index + 1}. {section}</h2>
              {index === sections.length - 1 ? (
                <ul>
                  <li>[Наименование оператора]</li>
                  <li>[Адрес электронной почты]</li>
                  <li>[Иные утверждённые реквизиты]</li>
                </ul>
              ) : (
                <div className="placeholder-lines" aria-label="Текст будет добавлен после утверждения"><i /><i /><i /></div>
              )}
            </section>
          ))}
          <Link href="/" className="button button--primary legal-bottom-back">← &nbsp; Вернуться на сайт</Link>
        </article>
      </div>
      <footer className="inner-footer"><span>© ИИ-студия Дмитрия Иванова</span><span>Все права защищены</span></footer>
    </main>
  );
}
