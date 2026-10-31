export const ADMIN_FIELD_LABELS = {
  name: "이름",
  loginId: "아이디",
  createdAt: "만든 날",
} as const;

export const ADMIN_LOAD_MESSAGES = {
  loadFailed:
    "어드민 계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const;

export const ADMIN_NOT_FOUND_MESSAGES = {
  description: "어드민 계정을 찾을 수 없습니다.",
} as const;
