"use client";

import Link from "next/link";
import SiteHeader from "../site-header";
import { withNbsp } from "../typography";
import type { Scenario } from "./data";

export function SolutionsHeader() {
  return <SiteHeader active="solutions" />;
}

export function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <article className="scenario-card">
      <div className="scenario-card-before">
        <h2>{withNbsp(scenario.title)}</h2>
        <strong>Было</strong>
        <p>{withNbsp(scenario.before)}</p>
      </div>
      <div className="scenario-card-after">
        <strong>Стало</strong>
        <p>{withNbsp(scenario.after)}</p>
      </div>
    </article>
  );
}

export function SolutionsFooter() {
  return (
    <footer className="solutions-footer">
      <div className="container">
        <Link className="text-arrow-link" href="/">
          <span aria-hidden="true">←</span>
          <span>На главную</span>
        </Link>
        <span>© ИИ-студия Дмитрия Иванова</span>
      </div>
    </footer>
  );
}
