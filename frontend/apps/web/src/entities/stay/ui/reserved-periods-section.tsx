import { useId } from "react";
import type { ReactNode } from "react";
import { RESERVED_PERIODS_MESSAGES } from "../config/messages";

type ReservedPeriodsSectionProps = {
  children: ReactNode;
};

export function ReservedPeriodsSection({
  children,
}: ReservedPeriodsSectionProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-2 rounded-2xl bg-gray-50 p-4"
    >
      <h2 id={titleId} className="text-base font-semibold text-gray-900">
        {RESERVED_PERIODS_MESSAGES.title}
      </h2>
      <p className="text-sm text-gray-500">
        {RESERVED_PERIODS_MESSAGES.description}
      </p>
      {children}
    </section>
  );
}
