import type { MyStay } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { formatWon } from "@/shared/lib/money";
import { MY_STAY_MESSAGES, STAY_LABELS } from "../config/messages";
import { formatStayPeriod } from "../lib/stay-period";

type MyStayCardProps = {
  stay: MyStay;
};

export function MyStayCard({ stay }: MyStayCardProps) {
  const rows = [
    { label: COMMON_MESSAGES.roomType, value: stay.roomType.name },
    { label: STAY_LABELS.period, value: formatStayPeriod(stay) },
    {
      label: STAY_LABELS.guestCount,
      value: COMMON_MESSAGES.people(stay.guestCount),
    },
    { label: STAY_LABELS.totalAmount, value: formatWon(stay.totalAmount) },
  ];

  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900">{stay.hotel.name}</h3>
        {stay.canceledAt !== null ? (
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {MY_STAY_MESSAGES.canceled}
          </span>
        ) : null}
      </div>
      <dl className="flex flex-col gap-1 text-sm">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="shrink-0 text-gray-500">{label}</dt>
            <dd className="text-right text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
