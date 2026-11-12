import type { ReactNode } from "react";
import { sectionMetadata } from "@/i18n/metadata";

export const generateMetadata = sectionMetadata("account", "/mon-compte", { index: false });

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
