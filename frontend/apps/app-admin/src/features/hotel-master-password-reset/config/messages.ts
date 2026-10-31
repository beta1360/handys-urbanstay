import {
  HOTEL_MASTER_INFO_MESSAGES,
  HOTEL_MASTER_PASSWORD_LENGTH,
} from "@/entities/hotel-master";

export const HOTEL_MASTER_PASSWORD_RESET_MESSAGES = {
  passwordLabel: "새 비밀번호",
  passwordHint: `${HOTEL_MASTER_INFO_MESSAGES.passwordHint(
    HOTEL_MASTER_PASSWORD_LENGTH.min,
    HOTEL_MASTER_PASSWORD_LENGTH.max,
  )}. 재설정하면 마스터가 로그인해 둔 세션이 끊겨 새 비밀번호로 다시 로그인해야 합니다.`,
  submit: "비밀번호 재설정",
} as const;
