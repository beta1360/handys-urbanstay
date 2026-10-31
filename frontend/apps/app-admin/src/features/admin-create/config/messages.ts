import { createAdminBodySchema } from "@/shared/api";
import { ACCOUNT_FORM_MESSAGES } from "@/shared/config";

const passwordRule = createAdminBodySchema.shape.password;

export const ADMIN_CREATE_FORM_MESSAGES = {
  loginIdHint: "이메일 형식. 어드민이 app-admin에 로그인할 때 씁니다.",
  passwordHint: ACCOUNT_FORM_MESSAGES.passwordHint(
    passwordRule.minLength,
    passwordRule.maxLength,
  ),
} as const;
