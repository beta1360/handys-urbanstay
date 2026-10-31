import { useId } from "react";
import type { ReactNode } from "react";
import { Card } from "@repo/ui/card";
import { HOTEL_MASTER_INFO_MESSAGES } from "../config/messages";

type HotelMasterSectionProps = {
  action?: ReactNode;
  children: ReactNode;
};

export function HotelMasterSection({
  action,
  children,
}: HotelMasterSectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <Card
        header={
          <div className="flex min-h-10 items-center justify-between gap-4">
            <h2
              id={headingId}
              className="text-base font-semibold text-neutral-900"
            >
              {HOTEL_MASTER_INFO_MESSAGES.legend}
            </h2>
            {action}
          </div>
        }
      >
        <div className="flex flex-col gap-6">{children}</div>
      </Card>
    </section>
  );
}
