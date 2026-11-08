import type { ReactNode } from "react";
import { formatNumber, formatPercent, ratio } from "./format";

export interface FunnelStep {
  key: string;
  label: ReactNode;
  value: number;
}

/**
 * Steps of a path, each bar sized against the first step (one measure, one
 * colour). Between two steps, the share that went on — the drop-off reads
 * as words and figures, not just bar lengths.
 */
export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const first = steps[0]?.value ?? 0;
  if (first === 0) return <p className="text-secondary small mb-0">Aucun visiteur sur la période.</p>;

  return (
    <ol className="list-unstyled mb-0 chc-funnel">
      {steps.map((step, i) => {
        const share = ratio(step.value, first);
        const previous = i > 0 ? steps[i - 1].value : null;
        return (
          <li key={step.key}>
            {previous !== null && (
              <div className="chc-funnel-link small">
                <span aria-hidden="true">↓</span> {formatPercent(ratio(step.value, previous))} continuent
              </div>
            )}
            <div className="d-flex justify-content-between align-items-baseline gap-3">
              <span className="small fw-medium">{step.label}</span>
              <span className="text-nowrap chc-num">
                <span className="fw-semibold">{formatNumber(step.value)}</span>
                <span className="text-secondary small ms-2">{formatPercent(share)}</span>
              </span>
            </div>
            <div className="chc-funnel-track" aria-hidden="true">
              <div className="chc-funnel-fill" style={{ width: `${Math.max(share * 100, 1.5)}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
