import { STAY_MESSAGES } from "../config/messages";
import { STAY_RULES } from "../config/rules";

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

export type StayPeriod = {
  checkInDate: string;
  checkOutDate: string;
};

export type CheckOutDateIssue = "afterCheckIn" | "maxNights";

function toEpochDay(date: string) {
  return Date.parse(date) / DAY_MILLISECONDS;
}

export function countNights({ checkInDate, checkOutDate }: StayPeriod) {
  return toEpochDay(checkOutDate) - toEpochDay(checkInDate);
}

export function formatStayPeriod(period: StayPeriod) {
  return STAY_MESSAGES.periodWithNights(
    period.checkInDate,
    period.checkOutDate,
    countNights(period),
  );
}

export function isTodayOrLater(date: string, today: string) {
  return date >= today;
}

export function findCheckOutDateIssue(
  period: StayPeriod,
): CheckOutDateIssue | undefined {
  if (period.checkOutDate <= period.checkInDate) {
    return "afterCheckIn";
  }
  return countNights(period) > STAY_RULES.maxNights ? "maxNights" : undefined;
}
