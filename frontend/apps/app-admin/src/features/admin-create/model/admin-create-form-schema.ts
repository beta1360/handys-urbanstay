import type { z } from "zod";
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";
import { passwordSchema, requiredTextSchema } from "@repo/admin-kit/form";
import { createAdminInfoFormShape } from "@/entities/admin";
import { createAdminBodySchema } from "@/shared/api";

const rules = createAdminBodySchema.shape;

export const adminCreateFormSchema = createAdminBodySchema.extend({
  loginId: requiredTextSchema(
    rules.loginId,
    FORM_VALIDATION_MESSAGES.emailFormat,
  ),
  ...createAdminInfoFormShape(rules),
  password: passwordSchema(
    rules.password,
    FORM_VALIDATION_MESSAGES.passwordRule(
      rules.password.minLength,
      rules.password.maxLength,
    ),
  ),
});

export type AdminCreateFormValues = z.input<typeof adminCreateFormSchema>;

export const ADMIN_CREATE_FIELDS = [
  "loginId",
  "name",
  "password",
] as const satisfies readonly (keyof AdminCreateFormValues)[];

export type AdminCreateField = (typeof ADMIN_CREATE_FIELDS)[number];

export const EMPTY_ADMIN_CREATE_VALUES: AdminCreateFormValues = {
  loginId: "",
  name: "",
  password: "",
};
