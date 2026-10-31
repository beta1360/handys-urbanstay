import { z } from "zod";
import {
  findCheckOutDateIssue,
  isTodayOrLater,
  STAY_RULES,
  STAY_VALIDATION_MESSAGES,
} from "@/entities/stay";
import type { CheckOutDateIssue } from "@/entities/stay";
import { createStayBodySchema } from "@/shared/api";
import { FORM_VALIDATION_MESSAGES } from "@/shared/config";
import { getKoreanToday } from "@/shared/lib/date";
import { requiredIntegerSchema, requiredTextSchema } from "@/shared/lib/form";

const { checkInDate, checkOutDate, guestCount, guest } =
  createStayBodySchema.shape;

const CHECK_OUT_DATE_MESSAGES: Record<CheckOutDateIssue, string> = {
  afterCheckIn: STAY_VALIDATION_MESSAGES.afterCheckIn,
  maxNights: STAY_VALIDATION_MESSAGES.maxNights(STAY_RULES.maxNights),
};

export const STAY_RESERVE_FIELDS = [
  "checkInDate",
  "checkOutDate",
  "guestCount",
  "guest.name",
  "guest.phone",
  "guest.email",
] as const;

export type StayReserveField = (typeof STAY_RESERVE_FIELDS)[number];

function isDate(value: string) {
  return checkInDate.safeParse(value).success;
}

export function createStayReserveFormSchema(capacity: number) {
  return z
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
      guestCount: requiredIntegerSchema(guestCount.max(capacity)),
      guest: z.object({
        name: requiredTextSchema(guest.shape.name),
        phone: requiredTextSchema(
          guest.shape.phone,
          FORM_VALIDATION_MESSAGES.phoneFormat,
        ),
        email: requiredTextSchema(
          guest.shape.email,
          FORM_VALIDATION_MESSAGES.emailFormat,
        ),
      }),
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
}

export type StayReserveFormValues = z.input<
  ReturnType<typeof createStayReserveFormSchema>
>;

export const EMPTY_STAY_RESERVE_VALUES: StayReserveFormValues = {
  checkInDate: "",
  checkOutDate: "",
  guestCount: "",
  guest: { name: "", phone: "", email: "" },
};
