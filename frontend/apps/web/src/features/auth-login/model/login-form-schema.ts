import { z } from "zod";
import { loginBodySchema } from "@/shared/api";
import { FORM_VALIDATION_MESSAGES } from "@/shared/config";
import { passwordSchema, requiredTextSchema } from "@/shared/lib/form";

const { email, password } = loginBodySchema.shape;

export const LOGIN_FIELDS = ["email", "password"] as const;

export type LoginField = (typeof LOGIN_FIELDS)[number];

export const loginFormSchema = z.object({
  email: requiredTextSchema(email),
  password: passwordSchema(password, FORM_VALIDATION_MESSAGES.required),
});

export type LoginFormValues = z.input<typeof loginFormSchema>;

export const EMPTY_LOGIN_VALUES: LoginFormValues = { email: "", password: "" };
