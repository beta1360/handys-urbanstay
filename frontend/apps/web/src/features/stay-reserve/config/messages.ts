export const STAY_RESERVE_LABELS = {
  guestName: "이름",
  guestPhone: "전화번호",
  guestEmail: "이메일",
} as const;

export const STAY_RESERVE_MESSAGES = {
  periodLegend: "기간과 인원",
  guestLegend: "예약자 정보",
  guestCountHint: (capacity: number) => `1~${capacity}명`,
  phoneHint: "숫자와 -만, 숫자 8~11개",
  emailHint: "이메일 형식. 예: guest@example.com",
  submit: "예약하기",
} as const;

export const STAY_RESERVE_COMPLETED_LABELS = {
  hotel: "호텔",
  room: "객실",
  guestName: "이용객",
} as const;
