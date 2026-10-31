export const GUEST_FIELD_LABELS = {
  name: "이름",
  phone: "전화번호",
  email: "이메일",
} as const;

export const GUEST_INFO_MESSAGES = {
  legend: "이용객 정보",
  phoneHint: "숫자와 -만, 숫자 8~11개",
  emailHint: "이메일 형식. 예: guest@example.com",
} as const;

export const GUEST_LOAD_MESSAGES = {
  loadFailed: "이용객 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const;

export const GUEST_NOT_FOUND_MESSAGES = {
  description: "이용객을 찾을 수 없습니다.",
} as const;
