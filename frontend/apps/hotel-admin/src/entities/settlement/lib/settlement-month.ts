import { settlementParamsSchema } from "@/shared/api";
import { getKoreanToday } from "@/shared/lib/date-time";
import { SETTLEMENT_MONTH_MESSAGES } from "../config/messages";

const MONTHS_PER_YEAR = 12;
const YEAR_MONTH_LENGTH = "YYYY-MM".length;

function toSettlementMonth(year: number, month: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

function parseSettlementMonth(month: string) {
  const [year, monthOfYear] = month.split("-").map(Number);
  return { year, monthOfYear };
}

function isSettlementMonth(value: string) {
  return settlementParamsSchema.shape.month.safeParse(value).success;
}

function getCurrentSettlementMonth() {
  return getKoreanToday().slice(0, YEAR_MONTH_LENGTH);
}

export function normalizeSettlementMonth(value: string | undefined) {
  return value !== undefined && isSettlementMonth(value)
    ? value
    : getCurrentSettlementMonth();
}

export function shiftSettlementMonth(month: string, offset: number) {
  const { year, monthOfYear } = parseSettlementMonth(month);
  const index = year * MONTHS_PER_YEAR + monthOfYear - 1 + offset;
  return toSettlementMonth(
    Math.floor(index / MONTHS_PER_YEAR),
    (index % MONTHS_PER_YEAR) + 1,
  );
}

export function formatSettlementMonth(month: string) {
  const { year, monthOfYear } = parseSettlementMonth(month);
  return SETTLEMENT_MONTH_MESSAGES.label(year, monthOfYear);
}
