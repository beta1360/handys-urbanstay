export const COMMON_MESSAGES = {
  loading: "불러오는 중입니다.",
  retry: "다시 시도",
  requestFailed: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  backToHotels: "호텔 목록",
  login: "로그인",
  signup: "회원가입",
  people: (count: number) => `${count}명`,
  won: (amount: string) => `${amount}원`,
} as const;
