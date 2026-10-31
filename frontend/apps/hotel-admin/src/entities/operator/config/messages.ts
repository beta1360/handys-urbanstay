export const OPERATOR_FIELD_LABELS = {
  name: "이름",
  loginId: "아이디",
  active: "사용 여부",
} as const;

export const OPERATOR_ACTIVE_LABELS = {
  active: "사용 중",
  inactive: "사용 안 함",
} as const;

export const OPERATOR_LOAD_MESSAGES = {
  loadFailed: "운영자 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const;

export const OPERATOR_NOT_FOUND_MESSAGES = {
  description: "운영자를 찾을 수 없습니다.",
} as const;
