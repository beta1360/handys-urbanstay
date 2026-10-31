"use client";

import { LoadingMessage } from "@/shared/ui";
import { useReservedPeriods } from "../model/use-reserved-periods";
import { ReservedPeriodList } from "./reserved-period-list";
import { ReservedPeriodsEmpty } from "./reserved-periods-empty";
import { ReservedPeriodsLoadFailed } from "./reserved-periods-load-failed";
import { ReservedPeriodsSection } from "./reserved-periods-section";

type ReservedPeriodsProps = {
  roomId: number;
};

export function ReservedPeriods({ roomId }: ReservedPeriodsProps) {
  const state = useReservedPeriods(roomId);

  return (
    <ReservedPeriodsSection>
      {state.status === "loading" ? <LoadingMessage /> : null}
      {state.status === "failed" ? (
        <ReservedPeriodsLoadFailed onRetry={state.retry} />
      ) : null}
      {state.status === "empty" ? <ReservedPeriodsEmpty /> : null}
      {state.status === "ready" ? (
        <ReservedPeriodList periods={state.periods} />
      ) : null}
    </ReservedPeriodsSection>
  );
}
