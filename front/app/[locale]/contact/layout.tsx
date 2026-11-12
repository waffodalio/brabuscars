import type { ReactNode } from "react";
import { sectionMetadata } from "@/i18n/metadata";

export const generateMetadata = sectionMetadata("contact", "/contact", { description: "contactDescription" });

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
