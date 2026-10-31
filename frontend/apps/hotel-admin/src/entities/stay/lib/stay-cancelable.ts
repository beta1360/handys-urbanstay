import type { Stay } from "@/shared/api";

export function isStayCancelable(
  { cancellation, checkOutDate }: Pick<Stay, "cancellation" | "checkOutDate">,
  today: string,
) {
  return cancellation === null && checkOutDate > today;
}
