import { z } from "zod";
import { roomTypeListParamsSchema } from "@/shared/api";
import { FORM_VALIDATION_MESSAGES } from "@/shared/config";
import { getKoreanToday } from "@/shared/lib/date";
import { requiredIntegerSchema, requiredTextSchema } from "@/shared/lib/form";
import { STAY_VALIDATION_MESSAGES } from "../config/messages";
import { STAY_RULES } from "../config/rules";
import { findCheckOutDateIssue, isTodayOrLater } from "../lib/stay-period";
import type { CheckOutDateIssue } from "../lib/stay-period";

const { checkInDate, checkOutDate, guestCount } =
  roomTypeListParamsSchema.shape;

const CHECK_OUT_DATE_MESSAGES: Record<CheckOutDateIssue, string> = {
  afterCheckIn: STAY_VALIDATION_MESSAGES.afterCheckIn,
  maxNights: STAY_VALIDATION_MESSAGES.maxNights(STAY_RULES.maxNights),
};

export const STAY_CRITERIA_FIELDS = [
  "checkInDate",
  "checkOutDate",
  "guestCount",
] as const;

export type StayCriteriaField = (typeof STAY_CRITERIA_FIELDS)[number];

function isDate(value: string) {
  return checkInDate.safeParse(value).success;
}

export const stayCriteriaSchema = z
  .object({
    checkInDate: requiredTextSchema(
      checkInDate,
      FORM_VALIDATION_MESSAGES.typeMismatch,
    ).superRefine((value, ctx) => {
      if (isDate(value) && !isTodayOrLater(value, getKoreanToday())) {
        ctx.addIssue({
          code: "custom",
          message: STAY_VALIDATION_MESSAGES.todayOrLater,
        });
      }
    }),
    checkOutDate: requiredTextSchema(
      checkOutDate,
      FORM_VALIDATION_MESSAGES.typeMismatch,
    ),
    guestCount: requiredIntegerSchema(guestCount),
  })
  .superRefine((values, ctx) => {
    if (!isDate(values.checkInDate) || !isDate(values.checkOutDate)) {
      return;
    }
    const issue = findCheckOutDateIssue(values);
    if (issue !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["checkOutDate"],
        message: CHECK_OUT_DATE_MESSAGES[issue],
      });
    }
  });

export type StayCriteriaValues = z.input<typeof stayCriteriaSchema>;

export type StayCriteria = z.output<typeof stayCriteriaSchema>;

export const EMPTY_STAY_CRITERIA_VALUES: StayCriteriaValues = {
  checkInDate: "",
  checkOutDate: "",
  guestCount: "",
};

export function parseStayCriteria(searchParams: URLSearchParams) {
  const result = stayCriteriaSchema.safeParse({
    checkInDate: searchParams.get("checkInDate") ?? "",
    checkOutDate: searchParams.get("checkOutDate") ?? "",
    guestCount: searchParams.get("guestCount") ?? "",
  });
  return result.success ? result.data : undefined;
}

export function toStayCriteriaValues(
  criteria: StayCriteria | undefined,
): StayCriteriaValues {
  if (criteria === undefined) {
    return EMPTY_STAY_CRITERIA_VALUES;
  }
  return { ...criteria, guestCount: String(criteria.guestCount) };
}

export function toStayCriteriaSearch(criteria: StayCriteria) {
  return `?${new URLSearchParams(toStayCriteriaValues(criteria)).toString()}`;
}
