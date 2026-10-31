export const STAY_FIELD_LABELS = {
  room: "객실",
  guest: "이용객",
  guestPhone: "이용객 전화번호",
  checkInDate: "체크인 날짜",
  checkOutDate: "체크아웃 날짜",
  nights: "박 수",
  guestCount: "인원",
  canceled: "취소 여부",
} as const;

export const STAY_CANCELED_LABELS = {
  false: "취소 안 됨",
  true: "취소됨",
} as const;

export const STAY_ROOM_OPTION_MESSAGES = {
  loadFailed: "객실 목록을 불러오지 못했습니다.",
} as const;

export const STAY_LINK_MESSAGES = {
  stays: "이용 보기",
} as const;
