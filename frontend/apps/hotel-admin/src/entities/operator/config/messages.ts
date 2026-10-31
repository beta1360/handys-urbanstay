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

export const OPERATOR_INFO_MESSAGES = {
  legend: "운영자 계정",
  loginIdLabel: "아이디(이메일)",
  loginIdHint: "이메일 형식. 운영자가 로그인할 때 씁니다.",
  passwordHint: (minLength: number | null, maxLength: number | null) =>
    `영문과 숫자를 모두 넣어 ${minLength}~${maxLength}자`,
} as const;
