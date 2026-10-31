import type { ReservedPeriod } from "@/shared/api";
import { useReservedPeriodsQuery } from "../api/reserved-periods-query";

export type ReservedPeriodsState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty" }
  | { status: "ready"; periods: ReservedPeriod[] };

export function useReservedPeriods(roomId: number): ReservedPeriodsState {
  const { data, error, refetch } = useReservedPeriodsQuery(roomId);

  if (data !== undefined) {
    return data.items.length === 0
      ? { status: "empty" }
      : { status: "ready", periods: data.items };
  }
  if (error === null) {
    return { status: "loading" };
  }
  return { status: "failed", retry: () => void refetch() };
}
