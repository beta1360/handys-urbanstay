export const ROOM_TYPE_LABELS = {
  roomType: "객실 유형",
} as const;

export const ROOM_TYPE_MESSAGES = {
  maxGuests: (maxGuests: number) => `최대 ${maxGuests}명`,
  roomRate: (roomRate: string) => `1박 ${roomRate}`,
  available: (availableCount: number) => `남은 객실 ${availableCount}개`,
  unavailable: "예약불가",
  empty: "예약할 수 있는 객실 유형이 없습니다.",
  loadFailed: "객실 유형을 불러오지 못했습니다.",
} as const;
