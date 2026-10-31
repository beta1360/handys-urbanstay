export const STAY_LABELS = {
  checkInDate: "체크인 날짜",
  checkOutDate: "체크아웃 날짜",
  guestCount: "인원",
  period: "기간",
} as const;

export const STAY_MESSAGES = {
  period: (checkInDate: string, checkOutDate: string) =>
    `${checkInDate} ~ ${checkOutDate}`,
  nights: (nights: number) => `${nights}박`,
} as const;

export const STAY_VALIDATION_MESSAGES = {
  todayOrLater: "오늘 이후 날짜를 입력해 주세요.",
  afterCheckIn: "체크인 날짜보다 뒤 날짜를 입력해 주세요.",
  maxNights: (maxNights: number) =>
    `최대 ${maxNights}박까지 등록할 수 있습니다.`,
  periodOverlapped: "같은 객실에 기간이 겹치는 이용이 이미 있습니다.",
} as const;

export const RESERVED_PERIODS_MESSAGES = {
  title: "예약된 기간",
  description: "체크아웃 날에는 새로 체크인할 수 있습니다.",
  empty: "예약된 기간이 없습니다.",
  loadFailed: "예약된 기간을 불러오지 못했습니다.",
} as const;
