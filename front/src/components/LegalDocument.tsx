"use client";

import Spinner from "react-bootstrap/Spinner";
import { useCompany } from "@/context/CompanyContext";
import { useLanguage } from "@/context/LanguageContext";
import { LEGAL_TEXTS, type LegalCompany } from "@/i18n/legal";

/**
 * Legal notice or privacy policy, in the site language, filled with the
 * dealership's details from `GET /api/company` (`src/i18n/legal.ts`).
 */
export function LegalDocument({ kind }: { kind: "legalNotice" | "privacy" }) {
  const company = useCompany();
  const { locale } = useLanguage();
  const texts = LEGAL_TEXTS[locale];

  if (!company) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" role="status" />
      </div>
    );
  }

  const details: LegalCompany = {
    name: company.name,
    legalName: company.legalName,
    address: `${company.address}, ${company.postalCode} ${company.city}, ${company.country}`,
    email: company.email,
    phone: company.phone,
    vatNumber: company.vatNumber,
    hosting: company.hosting,
  };
  const page = texts[kind](details);

  return (
    <article className="chc-legal">
      <header className="mb-4">
        <h1 className="h3 mb-1">{page.title}</h1>
        <p className="text-secondary small mb-0">{texts.updated}</p>
      </header>
      {page.intro && <p className="lead fs-6">{page.intro}</p>}
      {page.sections.map((section) => (
        <section key={section.title} className="mb-4">
          <h2 className="h5">{section.title}</h2>
          {section.items && (
            <ul className="mb-2">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mb-2">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
