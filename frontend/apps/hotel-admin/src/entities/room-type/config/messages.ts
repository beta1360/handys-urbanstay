export const ROOM_TYPE_FIELD_LABELS = {
  name: "이름",
  capacity: "최대 인원",
  roomRate: "1박 요금",
  checkInTime: "체크인 시각",
  checkOutTime: "체크아웃 시각",
} as const;

export const ROOM_TYPE_OPTION_MESSAGES = {
  placeholder: "유형 선택",
  loadFailed: "객실 유형을 불러오지 못했습니다.",
} as const;
