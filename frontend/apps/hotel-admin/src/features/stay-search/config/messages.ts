export const STAY_SEARCH_FORM_MESSAGES = {
  keywordPlaceholder: "이름 또는 전화번호",
  checkInFrom: "체크인 시작",
  checkInTo: "체크인 끝",
  checkInToBeforeFrom: "체크인 시작 날짜와 같거나 뒤여야 합니다.",
  guestFilterValue: (name: string, phone: string) => `${name} (${phone})`,
  clearGuestFilter: "이용객 거르기 풀기",
} as const;
