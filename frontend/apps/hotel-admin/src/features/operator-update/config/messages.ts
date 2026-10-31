import { OPERATOR_INFO_MESSAGES } from "@/entities/operator";

export const OPERATOR_UPDATE_FORM_MESSAGES = {
  loginIdHint: `${OPERATOR_INFO_MESSAGES.loginIdHint} 바꾸면 이 운영자가 로그인해 둔 세션이 끊겨 새 아이디로 다시 로그인해야 합니다.`,
} as const;
