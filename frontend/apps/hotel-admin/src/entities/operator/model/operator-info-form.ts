import type { z } from "zod";
import { passwordSchema, requiredTextSchema } from "@repo/admin-kit/form";
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";

export const OPERATOR_INFO_FIELDS = ["loginId", "name"] as const;

export type OperatorInfoField = (typeof OPERATOR_INFO_FIELDS)[number];

export function createOperatorInfoFormShape(
  rules: Record<OperatorInfoField, z.ZodType>,
) {
  return {
    loginId: requiredTextSchema(
      rules.loginId,
      FORM_VALIDATION_MESSAGES.emailFormat,
    ),
    name: requiredTextSchema(rules.name),
  };
}

export function createOperatorPasswordSchema(rule: z.ZodString) {
  return passwordSchema(
    rule,
    FORM_VALIDATION_MESSAGES.passwordRule(rule.minLength, rule.maxLength),
  );
}
