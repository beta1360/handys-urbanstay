import { HOTEL_MASTER_INFO_MESSAGES } from "@/entities/hotel-master";

export const HOTEL_MASTER_UPDATE_FORM_MESSAGES = {
  loginIdHint: `${HOTEL_MASTER_INFO_MESSAGES.loginIdHint} 바꾸면 마스터가 로그인해 둔 세션이 끊겨 새 아이디로 다시 로그인해야 합니다.`,
} as const;
