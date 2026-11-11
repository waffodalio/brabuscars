"use client";

import { useCallback, useEffect, useState } from "react";
import { healthService } from "@/services/healthService";

/** How often the system status is refreshed. */
const HEALTH_POLL_MS = 60_000;

export type SystemState = "checking" | "ok" | "degraded" | "down";

export const SYSTEM_LABELS: Record<SystemState, string> = {
  checking: "Vérification…",
  ok: "Tout fonctionne",
  degraded: "Base de données déconnectée",
  down: "API injoignable",
};

/** Polls `/health` while the admin is open (paused when the tab is hidden). */
export function useSystemState() {
  const [state, setState] = useState<SystemState>("checking");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);

  const check = useCallback(async (force = false) => {
    if (!force && document.visibilityState === "hidden") return;
    setBusy(true);
    try {
      const health = await healthService.get();
      setState(health.database === "connected" ? "ok" : "degraded");
    } catch {
      setState("down");
    }
    setCheckedAt(new Date());
    setBusy(false);
  }, []);

  useEffect(() => {
    const run = () => void check();
    run();
    const timer = window.setInterval(run, HEALTH_POLL_MS);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, [check]);

  return { state, checkedAt, busy, refresh: () => void check(true) };
}
