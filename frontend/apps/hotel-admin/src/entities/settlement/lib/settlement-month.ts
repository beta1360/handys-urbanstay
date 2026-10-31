import { settlementParamsSchema } from "@/shared/api";
import { SETTLEMENT_MONTH_MESSAGES } from "../config/messages";

const MONTHS_PER_YEAR = 12;

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
  const now = new Date();
  return toSettlementMonth(now.getFullYear(), now.getMonth() + 1);
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
