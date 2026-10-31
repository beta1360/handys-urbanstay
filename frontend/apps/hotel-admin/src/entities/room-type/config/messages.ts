export const ROOM_TYPE_FIELD_LABELS = {
  name: "이름",
  capacity: "최대 인원",
  roomRate: "1박 요금",
  checkInTime: "체크인 시각",
  checkOutTime: "체크아웃 시각",
} as const;

export const ROOM_TYPE_LOAD_MESSAGES = {
  loadFailed:
    "객실 유형 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const;

export const ROOM_TYPE_NOT_FOUND_MESSAGES = {
  description: "객실 유형을 찾을 수 없습니다.",
} as const;

export const ROOM_TYPE_INFO_MESSAGES = {
  legend: "객실 유형 정보",
  capacityHint: (min: number | null, max: number | null) =>
    `${min}~${max}명`,
  roomRateHint: (min: string, max: string) => `${min}~${max}. 숫자만 입력`,
} as const;

export const ROOM_TYPE_OPTION_MESSAGES = {
  placeholder: "유형 선택",
  loadFailed: "객실 유형을 불러오지 못했습니다.",
} as const;
