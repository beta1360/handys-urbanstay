export const HOTEL_FIELD_LABELS = {
  name: "이름",
  address: "주소",
  phone: "대표 전화번호",
  description: "소개",
} as const;

export const HOTEL_INFO_MESSAGES = {
  legend: "호텔 정보",
  phoneHint: "숫자와 -만, 숫자 8~11개",
  optional: "(선택)",
} as const;

export const HOTEL_LOAD_MESSAGES = {
  loadFailed: "호텔 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const;

export const HOTEL_INFORMATION_MESSAGES = {
  emptyDescription: "소개 없음",
} as const;
