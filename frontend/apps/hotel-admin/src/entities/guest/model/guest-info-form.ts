import type { z } from "zod";
import { requiredTextSchema } from "@repo/admin-kit/form";
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";

export const GUEST_INFO_FIELDS = ["name", "phone", "email"] as const;

export type GuestInfoField = (typeof GUEST_INFO_FIELDS)[number];

export function createGuestInfoFormShape(
  rules: Record<GuestInfoField, z.ZodType>,
) {
  return {
    name: requiredTextSchema(rules.name),
    phone: requiredTextSchema(
      rules.phone,
      FORM_VALIDATION_MESSAGES.phoneFormat,
    ),
    email: requiredTextSchema(
      rules.email,
      FORM_VALIDATION_MESSAGES.emailFormat,
    ),
  };
}
