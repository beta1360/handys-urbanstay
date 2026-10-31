export const GUEST_CURRENT_STAY_MESSAGES = {
  title: "지금 이용",
  room: "호실",
  roomType: "유형",
  period: "기간",
  periodValue: (checkInDate: string, checkOutDate: string) =>
    `${checkInDate} ~ ${checkOutDate}`,
  empty: "지금 이용 중인 객실이 없습니다.",
  stayDetail: "이용 상세",
} as const;
