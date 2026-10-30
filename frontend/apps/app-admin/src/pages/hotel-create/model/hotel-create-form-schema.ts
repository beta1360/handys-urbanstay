import type { z } from "zod";
import { createHotelBodySchema } from "@/shared/api";
import { FORM_VALIDATION_MESSAGES } from "../config/messages";
import { passwordSchema, requiredTextSchema } from "./form-field-schema";
import { createHotelInfoFormShape, HOTEL_INFO_FIELDS } from "./hotel-info-form";
import type { HotelInfoField } from "./hotel-info-form";

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

export type HotelCreateFieldErrors = Partial<Record<HotelCreateField, string>>;

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

type FieldMessage = { field: string; message: string };

function isHotelCreateField(field: string): field is HotelCreateField {
  return HOTEL_CREATE_FIELDS.some((createField) => createField === field);
}

export function toHotelCreateFieldErrors(fieldMessages: FieldMessage[]) {
  const errors: HotelCreateFieldErrors = {};
  for (const { field, message } of fieldMessages) {
    if (isHotelCreateField(field)) {
      errors[field] ??= message;
    }
  }
  return errors;
}

export function toIssueFieldMessages(error: z.ZodError): FieldMessage[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join("."),
    message: issue.message,
  }));
}
