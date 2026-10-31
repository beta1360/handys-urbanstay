export const STAY_SEARCH_FORM_MESSAGES = {
  all: "전체",
  guestFilterValue: (name: string, phone: string) => `${name} (${phone})`,
  clearGuestFilter: "이용객 거르기 풀기",
} as const;
