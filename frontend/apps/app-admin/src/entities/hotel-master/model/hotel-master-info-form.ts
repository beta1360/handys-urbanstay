import type { z } from "zod";
import { requiredTextSchema } from "@repo/admin-kit/form";
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";

export const HOTEL_MASTER_INFO_FIELDS = ["loginId", "name"] as const;

export type HotelMasterInfoField = (typeof HOTEL_MASTER_INFO_FIELDS)[number];

export function createHotelMasterInfoFormShape(
  rules: Record<HotelMasterInfoField, z.ZodType>,
) {
  return {
    loginId: requiredTextSchema(
      rules.loginId,
      FORM_VALIDATION_MESSAGES.emailFormat,
    ),
    name: requiredTextSchema(rules.name),
  };
}
