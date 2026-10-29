import { z } from "zod";
import { loginAccountBodySchema } from "@/shared/api";
import { LOGIN_MESSAGES } from "../config/messages";

function hasText(value: string) {
  return value.trim() !== "";
}

export const loginFormSchema = loginAccountBodySchema.extend({
  loginId: z
    .string()
    .refine(hasText, LOGIN_MESSAGES.loginIdRequired)
    .pipe(loginAccountBodySchema.shape.loginId),
  password: z
    .string()
    .refine(hasText, LOGIN_MESSAGES.passwordRequired)
    .pipe(loginAccountBodySchema.shape.password),
});

export type LoginFormValues = z.input<typeof loginFormSchema>;

export type LoginField = keyof LoginFormValues;

export const LOGIN_FIELDS = [
  "loginId",
  "password",
] as const satisfies readonly LoginField[];
