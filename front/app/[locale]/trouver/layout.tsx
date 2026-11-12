import type { ReactNode } from "react";
import { sectionMetadata } from "@/i18n/metadata";

export const generateMetadata = sectionMetadata("finder", "/trouver", { description: "finderDescription" });

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
