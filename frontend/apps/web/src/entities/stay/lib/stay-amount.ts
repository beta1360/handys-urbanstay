import type { StayPeriod } from "./stay-period";
import { countNights } from "./stay-period";

export function estimateTotalAmount(roomRate: number, period: StayPeriod) {
  return roomRate * countNights(period);
}
