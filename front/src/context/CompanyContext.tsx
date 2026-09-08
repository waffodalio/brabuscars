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

/** Fetches the (rarely changing) company info once and shares it. */
export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    companyService
      .get()
      .then(setCompany)
      .catch(() => setCompany(null));
  }, []);

  return (
    <CompanyContext.Provider value={company}>
      {children}
    </CompanyContext.Provider>
  );
}

/** May be `null` briefly on first load or if the request failed. */
export function useCompany(): Company | null {
  return useContext(CompanyContext);
}
