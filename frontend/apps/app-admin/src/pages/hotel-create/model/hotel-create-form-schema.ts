import type { z } from "zod";
import {
  createHotelInfoFormShape,
  HOTEL_INFO_FIELDS,
} from "@/features/hotel-info-form";
import type { HotelInfoField } from "@/features/hotel-info-form";
import { createHotelBodySchema } from "@/shared/api";
import { FORM_VALIDATION_MESSAGES } from "@/shared/config";
import { passwordSchema, requiredTextSchema } from "@/shared/lib/form";
import type { FieldErrors } from "@/shared/lib/form";

const masterRules = createHotelBodySchema.shape.master;

const passwordRule = masterRules.shape.password;

export const MASTER_PASSWORD_LENGTH = {
  min: passwordRule.minLength,
  max: passwordRule.maxLength,
};

export const hotelCreateFormSchema = createHotelBodySchema.extend({
  ...createHotelInfoFormShape(createHotelBodySchema.shape),
  master: masterRules.extend({
    loginId: requiredTextSchema(
      masterRules.shape.loginId,
      FORM_VALIDATION_MESSAGES.emailFormat,
    ),
    name: requiredTextSchema(masterRules.shape.name),
    password: passwordSchema(
      passwordRule,
      FORM_VALIDATION_MESSAGES.passwordRule(
        MASTER_PASSWORD_LENGTH.min,
        MASTER_PASSWORD_LENGTH.max,
      ),
    ),
  }),
});

export type HotelCreateFormValues = z.input<typeof hotelCreateFormSchema>;

export type MasterField = keyof HotelCreateFormValues["master"];

export type HotelCreateField = HotelInfoField | `master.${MasterField}`;

export type HotelCreateFieldErrors = FieldErrors<HotelCreateField>;

export const HOTEL_CREATE_FIELDS = [
  ...HOTEL_INFO_FIELDS,
  "master.loginId",
  "master.name",
  "master.password",
] as const satisfies readonly HotelCreateField[];

export const EMPTY_HOTEL_CREATE_VALUES: HotelCreateFormValues = {
  name: "",
  address: "",
  phone: "",
  description: "",
  master: { loginId: "", name: "", password: "" },
};
