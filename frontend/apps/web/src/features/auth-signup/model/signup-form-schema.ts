import { z } from "zod";
import { signupBodySchema } from "@/shared/api";
import { FORM_VALIDATION_MESSAGES } from "@/shared/config";
import { passwordSchema, requiredTextSchema } from "@/shared/lib/form";

const { email, password, name, phone } = signupBodySchema.shape;

export const PASSWORD_LENGTH = {
  min: password.minLength,
  max: password.maxLength,
} as const;

export const SIGNUP_FIELDS = ["email", "password", "name", "phone"] as const;

export type SignupField = (typeof SIGNUP_FIELDS)[number];

export const signupFormSchema = z.object({
  email: requiredTextSchema(email, FORM_VALIDATION_MESSAGES.emailFormat),
  password: passwordSchema(
    password,
    FORM_VALIDATION_MESSAGES.passwordRule(
      PASSWORD_LENGTH.min,
      PASSWORD_LENGTH.max,
    ),
  ),
  name: requiredTextSchema(name),
  phone: requiredTextSchema(phone, FORM_VALIDATION_MESSAGES.phoneFormat),
});

export type SignupFormValues = z.input<typeof signupFormSchema>;

export const EMPTY_SIGNUP_VALUES: SignupFormValues = {
  email: "",
  password: "",
  name: "",
  phone: "",
};
