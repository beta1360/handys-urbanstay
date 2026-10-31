export const MEMBER_STAY_HISTORY_MESSAGES = {
  title: "호텔 이용 기록",
  hotel: "호텔",
  period: "기간",
  periodValue: (checkInDate: string, checkOutDate: string, nights: number) =>
    `${checkInDate} ~ ${checkOutDate} (${nights}박)`,
  guestCount: "인원",
  guestCountValue: (guestCount: number) => `${guestCount}명`,
  totalAmount: "최종 금액",
  canceled: "취소 여부",
  canceledValue: "취소됨",
  empty: "호텔 이용 기록이 없습니다.",
  loadFailed:
    "호텔 이용 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const;
