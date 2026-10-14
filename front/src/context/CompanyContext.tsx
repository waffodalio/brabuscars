"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { companyService } from "@/services/companyService";
import type { Company } from "@/types/company";

const CompanyContext = createContext<Company | null>(null);

/** Back-off between attempts when the API is briefly unavailable (e.g. during a redeploy). */
const RETRY_DELAYS_MS = [2_000, 5_000, 15_000];

/** Fetches the (rarely changing) company info once and shares it. */
export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    function load(attempt: number) {
      companyService
        .get()
        .then((data) => {
          if (!cancelled) setCompany(data);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          if (attempt < RETRY_DELAYS_MS.length) {
            timer = window.setTimeout(() => load(attempt + 1), RETRY_DELAYS_MS[attempt]);
          } else {
            // The pages degrade gracefully (address blocks hidden); leave a trace.
            console.error("[company] coordinates unavailable", err);
          }
        });
    }

    load(0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <CompanyContext.Provider value={company}>
      {children}
    </CompanyContext.Provider>
  );
}

/** `null` while loading, and if every attempt failed. */
export function useCompany(): Company | null {
  return useContext(CompanyContext);
}
