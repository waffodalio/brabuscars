"use client";

import { useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { publicErrorMessage } from "@/utils/errors";

/** {@link publicErrorMessage} bound to the current language's `t.errors`. */
export function usePublicErrorMessage() {
  const { t } = useLanguage();
  return useCallback(
    (
      err: unknown,
      fallback: string,
      overrides?: Partial<Record<number, string>>,
    ) => publicErrorMessage(err, t.errors, fallback, overrides),
    [t],
  );
}
