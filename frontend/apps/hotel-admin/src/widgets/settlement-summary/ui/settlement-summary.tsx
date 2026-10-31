import { SettlementLoading } from "@/entities/settlement";
import { SETTLEMENT_SUMMARY_MESSAGES } from "../config/messages";
import { useSettlementSummary } from "../model/use-settlement-summary";
import type { SettlementSummaryState } from "../model/use-settlement-summary";
import { SettlementSummaryContent } from "./settlement-summary-content";
import { SettlementSummaryLoadFailed } from "./settlement-summary-load-failed";

function SettlementSummaryBody({ state }: { state: SettlementSummaryState }) {
  switch (state.status) {
    case "loading":
      return <SettlementLoading />;
    case "failed":
      return <SettlementSummaryLoadFailed onRetry={state.retry} />;
    case "ready":
      return <SettlementSummaryContent settlement={state.settlement} />;
  }
}

type SettlementSummaryProps = {
  month: string;
};

export function SettlementSummary({ month }: SettlementSummaryProps) {
  const state = useSettlementSummary(month);

  return (
    <div className="flex flex-col gap-2">
      <SettlementSummaryBody state={state} />
      <p className="text-sm text-neutral-500">
        {SETTLEMENT_SUMMARY_MESSAGES.basis}
      </p>
    </div>
  );
}
