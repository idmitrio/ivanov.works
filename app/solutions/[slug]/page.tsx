import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSolutionDirection, solutionDirections } from "../data";
import {
  ScenarioCard,
  SolutionsFooter,
  SolutionsHeader,
} from "../solutions-ui";
import { withNbsp } from "../../typography";
import { ContactButton } from "../../contact-modal";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return solutionDirections.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const direction = getSolutionDirection(slug);
  if (!direction) return {};

  return {
    title: `${direction.title}: сценарии автоматизации — ИИ-студия Дмитрия Иванова`,
    description: direction.description,
    alternates: { canonical: `/solutions/${direction.slug}` },
  };
}

export default async function SolutionDirectionPage({ params }: PageProps) {
  const { slug } = await params;
  const direction = getSolutionDirection(slug);
  if (!direction) notFound();

  return (
    <main className="solution-direction-page">
      <SolutionsHeader />
      <section className="solution-direction-hero">
        <div className="container">
          <Link className="solution-back-link text-arrow-link" href="/solutions">
            <span aria-hidden="true">←</span>
            <span>Все направления</span>
          </Link>
          <p className="section-kicker section-kicker--dark">СЦЕНАРИИ АВТОМАТИЗАЦИИ</p>
          <h1>{withNbsp(direction.title)}</h1>
          <p>{withNbsp(direction.description)}</p>
        </div>
      </section>
      <section className="scenario-section">
        <div className="container">
          <div className="scenario-grid">
            {direction.scenarios.map((scenario) => (
              <ScenarioCard scenario={scenario} key={scenario.title} />
            ))}
          </div>
        </div>
      </section>
      <section className="solutions-page-cta">
        <div className="container">
          <div>
            <p className="section-kicker section-kicker--dark">СЛЕДУЮЩИЙ ШАГ</p>
            <h2>Обсудим похожую задачу</h2>
            <p>Для первого разговора достаточно описать процесс. Документы и доступы не нужны.</p>
          </div>
          <ContactButton />
        </div>
      </section>
      <SolutionsFooter />
    </main>
  );
}
