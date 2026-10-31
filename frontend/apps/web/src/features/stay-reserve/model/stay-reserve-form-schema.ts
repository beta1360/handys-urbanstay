import { z } from "zod";
import { FORM_VALIDATION_MESSAGES } from "@/shared/config";

export const STAY_RESERVE_FIELDS = ["roomTypeId"] as const;

export type StayReserveField = (typeof STAY_RESERVE_FIELDS)[number];

export const stayReserveFormSchema = z.object({
  roomTypeId: z.string().min(1, FORM_VALIDATION_MESSAGES.required),
});

export type StayReserveFormValues = z.input<typeof stayReserveFormSchema>;

export const EMPTY_STAY_RESERVE_VALUES: StayReserveFormValues = {
  roomTypeId: "",
};
