import { useSettlementQuery } from "@/entities/settlement";
import type { Settlement } from "@/shared/api";

export type SettlementSummaryState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "ready"; settlement: Settlement };

export function useSettlementSummary(month: string): SettlementSummaryState {
  const { data, isError, refetch } = useSettlementQuery(month);

  if (data === undefined) {
    return isError
      ? { status: "failed", retry: () => void refetch() }
      : { status: "loading" };
  }
  return { status: "ready", settlement: data };
}
