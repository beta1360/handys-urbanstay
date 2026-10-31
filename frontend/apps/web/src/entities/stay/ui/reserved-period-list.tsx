import type { ReservedPeriod } from "@/shared/api";
import { STAY_MESSAGES } from "../config/messages";

type ReservedPeriodListProps = {
  periods: ReservedPeriod[];
};

export function ReservedPeriodList({ periods }: ReservedPeriodListProps) {
  return (
    <ul className="flex flex-col gap-1 text-sm text-gray-900">
      {periods.map(({ checkInDate, checkOutDate }) => (
        <li key={`${checkInDate}-${checkOutDate}`}>
          {STAY_MESSAGES.period(checkInDate, checkOutDate)}
        </li>
      ))}
    </ul>
  );
}
