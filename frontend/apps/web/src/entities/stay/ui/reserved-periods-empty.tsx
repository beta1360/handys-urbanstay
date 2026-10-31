import { RESERVED_PERIODS_MESSAGES } from "../config/messages";

export function ReservedPeriodsEmpty() {
  return (
    <p className="text-sm text-gray-900">{RESERVED_PERIODS_MESSAGES.empty}</p>
  );
}
