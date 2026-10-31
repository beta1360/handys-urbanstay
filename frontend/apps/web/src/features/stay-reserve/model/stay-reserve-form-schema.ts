import { z } from "zod";
import { createStayBodySchema } from "@/shared/api";
import { FORM_VALIDATION_MESSAGES } from "@/shared/config";
import { requiredTextSchema } from "@/shared/lib/form";

const { roomType, guest } = createStayBodySchema.shape;

export const STAY_RESERVE_FIELDS = [
  "roomType",
  "guest.name",
  "guest.phone",
  "guest.email",
] as const;

export type StayReserveField = (typeof STAY_RESERVE_FIELDS)[number];

export const stayReserveFormSchema = z.object({
  roomType: requiredTextSchema(roomType),
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
});

export type StayReserveFormValues = z.input<typeof stayReserveFormSchema>;

export const EMPTY_STAY_RESERVE_VALUES: StayReserveFormValues = {
  roomType: "",
  guest: { name: "", phone: "", email: "" },
};
