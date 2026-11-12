import type { ReactNode } from "react";
import { sectionMetadata } from "@/i18n/metadata";

export const generateMetadata = sectionMetadata("register", "/inscription", { index: false });

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
