export const STAY_LABELS = {
  checkInDate: "체크인 날짜",
  checkOutDate: "체크아웃 날짜",
  guestCount: "인원",
  period: "기간",
  roomRate: "1박 요금",
  totalAmount: "최종 금액",
} as const;

export const STAY_MESSAGES = {
  periodWithNights: (
    checkInDate: string,
    checkOutDate: string,
    nights: number,
  ) => `${checkInDate} ~ ${checkOutDate} (${nights}박)`,
} as const;

export const STAY_VALIDATION_MESSAGES = {
  todayOrLater: "오늘 이후 날짜를 입력해 주세요.",
  afterCheckIn: "체크인 날짜보다 뒤 날짜를 입력해 주세요.",
  maxNights: (maxNights: number) =>
    `최대 ${maxNights}박까지 등록할 수 있습니다.`,
} as const;
