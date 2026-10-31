export const MEMBER_FIELD_LABELS = {
  name: "이름",
  email: "이메일",
  phone: "전화번호",
  createdAt: "가입일",
} as const;

export const MEMBER_LOAD_MESSAGES = {
  loadFailed: "회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const;

export const MEMBER_NOT_FOUND_MESSAGES = {
  description: "회원을 찾을 수 없습니다.",
} as const;
