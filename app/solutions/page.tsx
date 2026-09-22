import type { Metadata } from "next";
import Link from "next/link";
import { solutionDirections } from "./data";
import { SolutionsFooter, SolutionsHeader } from "./solutions-ui";
import { withNbsp } from "../typography";
import { ContactButton } from "../contact-modal";

export const metadata: Metadata = {
  title: "Сценарии автоматизации — ИИ-студия Дмитрия Иванова",
  description:
    "Примеры автоматизации работы с документами, заявками, обращениями, внутренней документацией и отчетами.",
  alternates: { canonical: "/solutions" },
};

export default function SolutionsPage() {
  return (
    <main className="solutions-catalog-page">
      <SolutionsHeader />
      <section className="solutions-catalog-hero">
        <div className="container">
          <p className="section-kicker section-kicker--dark">РЕШЕНИЯ</p>
          <h1>Что можно автоматизировать</h1>
          <p>
            Примеры процессов, в которых система может взять на себя повторяющиеся
            операции. Выберите направление, похожее на вашу задачу.
          </p>
        </div>
      </section>
      <section className="solutions-catalog-list">
        <div className="container">
          {solutionDirections.map((direction) => (
            <Link
              className="solution-direction-row"
              href={`/solutions/${direction.slug}`}
              key={direction.slug}
            >
              <span className="solution-direction-copy">
                <strong>{withNbsp(direction.title)}</strong>
                <span>{withNbsp(direction.description)}</span>
              </span>
              <span className="solution-direction-count">
                {direction.scenarios.length} {scenarioWord(direction.scenarios.length)}
              </span>
              <span className="solution-direction-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="solutions-page-cta">
        <div className="container">
          <div>
            <p className="section-kicker section-kicker--dark">СЛЕДУЮЩИЙ ШАГ</p>
            <h2>Не нашли точного примера?</h2>
            <p>Опишите процесс своими словами. Разберем, есть ли смысл его автоматизировать.</p>
          </div>
          <ContactButton />
        </div>
      </section>
      <SolutionsFooter />
    </main>
  );
}

function scenarioWord(count: number) {
  if (count === 1) return "сценарий";
  if (count >= 2 && count <= 4) return "сценария";
  return "сценариев";
}
