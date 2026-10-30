import type { z } from "zod";
import { FORM_VALIDATION_MESSAGES } from "../config/messages";
import { optionalTextSchema, requiredTextSchema } from "./form-field-schema";

export const HOTEL_INFO_FIELDS = [
  "name",
  "address",
  "phone",
  "description",
] as const;

export type HotelInfoField = (typeof HOTEL_INFO_FIELDS)[number];

export type HotelInfoValues = Record<HotelInfoField, string>;

export function createHotelInfoFormShape(
  rules: Record<HotelInfoField, z.ZodType>,
) {
  return {
    name: requiredTextSchema(rules.name),
    address: requiredTextSchema(rules.address),
    phone: requiredTextSchema(
      rules.phone,
      FORM_VALIDATION_MESSAGES.phoneFormat,
    ),
    description: optionalTextSchema(rules.description),
  };
}
