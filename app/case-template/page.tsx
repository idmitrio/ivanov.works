"use client";

import Link from "next/link";
import { useState } from "react";

export default function CaseTemplate() {
  const [modal, setModal] = useState(false);
  return (
    <main className="case-page">
      <header className="inner-header">
        <Link href="/"><img src="/brand/ivanov-ai-logo-black.svg" alt="ИИ-студия Дмитрия Иванова" /></Link>
        <nav><Link href="/#solutions">Решения</Link><Link href="/#process">Процесс</Link><Link href="/#about">О студии</Link></nav>
        <button className="button button--primary" onClick={() => setModal(true)}>Обсудить процесс</button>
      </header>
      <section className="case-hero">
        <div>
          <p className="section-kicker">ШАБЛОН КЕЙСА</p>
          <h1>[Отрасль или название компании]</h1>
          <p className="case-subtitle">[Кратко: какой процесс изменили и зачем]</p>
          <p className="case-meta">[Отрасль] &nbsp;·&nbsp; [Контур процесса] &nbsp;·&nbsp; [Период]</p>
        </div>
        <img src="/brand/ivanov-ai-logo.svg" alt="" />
      </section>
      <div className="case-content">
        <section className="case-split">
          <div><h2>Исходная ситуация</h2><p>[Опишите текущий процесс и контекст до начала проекта. Какие трудности, ограничения и последствия это создавало.]</p></div>
          <div><h2>Задача</h2><p>[Опишите цель и задачи проекта. Что важно было достичь в рамках изменений.]</p></div>
        </section>
        <section>
          <h2>Что сделали</h2>
          <p>[Кратко опишите подход и ключевые шаги проекта.]</p>
          <div className="case-steps">{["Аналитика и исследование","Проектирование решения","Разработка и интеграция","Тестирование и валидация","Запуск и внедрение","Сопровождение и развитие"].map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></div>)}</div>
          <div className="case-note">✓ &nbsp; [Добавьте важные пояснения к подходу, архитектуре или методам.]</div>
        </section>
        <section>
          <h2>Результат</h2>
          <p>[Опишите, что изменилось после внедрения решения. Какие эффекты для процесса, команды или бизнеса.]</p>
          <aside className="verified">▣ &nbsp; Публиковать только после подтверждения данных</aside>
          <h2>Показатели: было / стало</h2>
          <table><thead><tr><th>Показатель</th><th>Было</th><th>Стало</th></tr></thead><tbody>{Array.from({length: 4}).map((_, i) => <tr key={i}><td>[Подтвержденный показатель]</td><td>[Значение]</td><td>[Значение]</td></tr>)}</tbody></table>
          <p className="case-source">ⓘ Источник данных: [документ / отчет / система]</p>
        </section>
        <section className="case-three">
          <div><h2>Ограничения решения</h2><p>[Опишите границы применимости решения и известные ограничения.]</p></div>
          <div><h2>Используемые системы</h2><p>[Перечислите ключевые системы, сервисы и инструменты.]</p></div>
          <div><h2>Следующий этап</h2><p>[Опишите планы по развитию решения и следующие шаги.]</p></div>
        </section>
      </div>
      <section className="case-cta"><div><h2>Хотите обсудить похожий процесс?</h2><p>Начнем с конкретной задачи и проверим, есть ли смысл двигаться дальше.</p></div><Link href="/#top" className="button button--primary">Обсудить процесс</Link></section>
      {modal && <div className="template-hint" role="dialog" aria-modal="true"><div><button onClick={() => setModal(false)} aria-label="Закрыть">×</button><h2>Шаблон будущего кейса</h2><p>На опубликованном кейсе эта кнопка откроет общую форму «Обсудить процесс».</p><Link href="/#top" className="button button--primary">Перейти на сайт</Link></div></div>}
    </main>
  );
}
