"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { ListingCard } from "@/components/ListingCard";
import { ListingCardSkeleton } from "@/components/ListingCardSkeleton";
import { useLanguage } from "@/context/LanguageContext";
import { listingService } from "@/services/listingService";
import type { Listing } from "@/types/listing";
import {
  BUDGETS,
  ENERGIES,
  GEARBOXES,
  USAGES,
  rankListings,
  type FinderAnswers,
} from "@/utils/carFinder";

type Step = keyof FinderAnswers;
const STEPS: Step[] = ["budget", "usage", "gearbox", "energy"];

/** Icon (SVG path) of each answer tile. */
const ICONS: Record<string, string> = {
  "2to5": "M18.5 7.2A6.5 6.5 0 1 0 18.5 16.8M4 10.5h9M4 13.5h9",
  "5to8": "M18.5 7.2A6.5 6.5 0 1 0 18.5 16.8M4 10.5h9M4 13.5h9",
  "8to11": "M18.5 7.2A6.5 6.5 0 1 0 18.5 16.8M4 10.5h9M4 13.5h9",
  "11to15": "M18.5 7.2A6.5 6.5 0 1 0 18.5 16.8M4 10.5h9M4 13.5h9",
  city: "M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1",
  family: "M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 15h2a4 4 0 0 1 4 4v2",
  travel: "M3 12h18M13 5l7 7-7 7",
  fun: "M13 2L3 14h9l-1 8 10-12h-9z",
  manual: "M6 4v16M12 4v16M18 4v8H6",
  automatic: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
  any: "M20 6L9 17l-5-5",
  petrol: "M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M3 10h12M15 13h2a2 2 0 0 1 2 2v3a2 2 0 0 0 4 0V9l-3-3",
  diesel: "M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M3 10h12M15 13h2a2 2 0 0 1 2 2v3a2 2 0 0 0 4 0V9l-3-3",
  electrified: "M13 2L3 14h9l-1 8 10-12h-9z",
};

const OPTIONS: Record<Step, readonly string[]> = {
  budget: BUDGETS,
  usage: USAGES,
  gearbox: GEARBOXES,
  energy: ENERGIES,
};

/**
 * « Trouve ma voiture »: four questions answered with big tiles, a progress
 * bar, then the published listings that fit best with their affinity score
 * (`utils/carFinder.ts`).
 */
export default function CarFinderPage() {
  const { t, withLocale } = useLanguage();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<FinderAnswers>>({});
  const [listings, setListings] = useState<Listing[] | null>(null);
  const done = step >= STEPS.length;

  // Loaded while the visitor answers (cached reads: instant if already seen).
  useEffect(() => {
    listingService
      .list({ status: "published" })
      .then(setListings)
      .catch(() => setListings([]));
  }, []);

  function choose(value: string) {
    setAnswers((current) => ({ ...current, [STEPS[step]]: value }));
    setStep((current) => current + 1);
  }

  function restart() {
    setAnswers({});
    setStep(0);
  }

  const label = (key: Step, value: string): string => {
    const labels = t.finder[key] as Record<string, string>;
    return labels[value];
  };

  return (
    <section className="chc-finder">
      <header className="text-center mb-4">
        <h1 className="h3 mb-1">{t.finder.title}</h1>
        <p className="text-secondary mb-0">{t.finder.lead}</p>
      </header>

      <div className="chc-finder-progress" aria-hidden="true">
        {STEPS.map((key, index) => (
          <span key={key} className={index < step ? "is-done" : index === step ? "is-current" : undefined} />
        ))}
      </div>

      {!done ? (
        <div key={step} className="chc-finder-step">
          <div className="chc-finder-count">{t.finder.step(step + 1, STEPS.length)}</div>
          <h2 className="chc-finder-question">{t.finder.questions[STEPS[step]]}</h2>
          <div className="chc-finder-tiles" role="group" aria-label={t.finder.questions[STEPS[step]]}>
            {OPTIONS[STEPS[step]].map((value) => (
              <button
                key={value}
                type="button"
                className={`chc-finder-tile${answers[STEPS[step]] === value ? " is-selected" : ""}`}
                onClick={() => choose(value)}
              >
                <span className="chc-finder-tile-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICONS[value]} />
                  </svg>
                </span>
                <span className="chc-finder-tile-label">{label(STEPS[step], value)}</span>
                {STEPS[step] === "usage" && (
                  <span className="chc-finder-tile-hint">
                    {t.finder.usageHint[value as keyof typeof t.finder.usageHint]}
                  </span>
                )}
              </button>
            ))}
          </div>
          {step > 0 && (
            <button type="button" className="chc-finder-back" onClick={() => setStep(step - 1)}>
              ← {t.finder.back}
            </button>
          )}
        </div>
      ) : (
        <Results
          answers={answers as FinderAnswers}
          listings={listings}
          summary={STEPS.map((key) => label(key, answers[key] as string))}
          onRestart={restart}
          seeAllHref={withLocale("/annonces")}
        />
      )}
    </section>
  );
}

function Results({
  answers,
  listings,
  summary,
  onRestart,
  seeAllHref,
}: {
  answers: FinderAnswers;
  listings: Listing[] | null;
  summary: string[];
  onRestart: () => void;
  seeAllHref: string;
}) {
  const { t } = useLanguage();
  const matches = listings ? rankListings(listings, answers) : [];

  return (
    <div className="chc-finder-step">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="chc-finder-question mb-2">{t.finder.resultsTitle}</h2>
          <div className="d-flex flex-wrap gap-2">
            {summary.map((item) => (
              <span key={item} className="chc-finder-chip">
                {item}
              </span>
            ))}
          </div>
        </div>
        <button type="button" className="btn btn-outline-primary" onClick={onRestart}>
          {t.finder.restart}
        </button>
      </div>

      {listings === null ? (
        <Row xs={2} lg={3} className="g-2 g-sm-3 g-lg-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Col key={i}>
              <ListingCardSkeleton />
            </Col>
          ))}
        </Row>
      ) : matches.length === 0 ? (
        <div className="chc-finder-none">
          <p className="mb-3">{t.finder.none}</p>
          <Link href={seeAllHref} className="btn btn-primary">
            {t.finder.seeAll}
          </Link>
        </div>
      ) : (
        <Row xs={2} lg={3} className="g-2 g-sm-3 g-lg-4 chc-stagger">
          {matches.map(({ listing, score }) => (
            <Col key={listing.id}>
              <div className="chc-finder-match">
                <span className="chc-finder-score" style={{ "--chc-score": score } as React.CSSProperties}>
                  {t.finder.match(score)}
                </span>
                <ListingCard listing={listing} />
              </div>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
