export const ROOM_LABELS = {
  capacity: "최대 인원",
  checkInTime: "체크인",
  checkOutTime: "체크아웃",
} as const;

export const ROOM_MESSAGES = {
  capacity: (capacity: number) => `${capacity}명`,
} as const;

export const ROOM_LIST_MESSAGES = {
  empty: "예약할 수 있는 객실이 없습니다.",
} as const;
