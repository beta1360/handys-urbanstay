export const STAY_FIELD_LABELS = {
  room: "객실",
  guest: "이용객",
  guestPhone: "이용객 전화번호",
  checkInDate: "체크인 날짜",
  checkOutDate: "체크아웃 날짜",
  guestCount: "인원",
  roomRate: "1박 요금",
  nights: "박 수",
  baseAmount: "기본 금액",
  discountAmount: "할인 금액",
  totalAmount: "최종 금액",
  amount: "금액",
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

export const STAY_CANCELLATION_LABELS = {
  title: "취소 정보",
  canceledAt: "취소 시각",
  canceledBy: "처리한 계정",
  reason: "취소 사유",
  emptyReason: "사유 없음",
} as const;

export const STAY_LOAD_MESSAGES = {
  loadFailed: "이용 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const;

export const STAY_NOT_FOUND_MESSAGES = {
  description: "이용을 찾을 수 없습니다.",
} as const;
