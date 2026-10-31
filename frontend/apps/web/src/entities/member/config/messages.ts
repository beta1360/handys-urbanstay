export const MEMBER_LABELS = {
  email: "이메일",
  password: "비밀번호",
  name: "이름",
  phone: "전화번호",
} as const;

export const MEMBER_HINTS = {
  email: "이메일 형식. 예: guest@example.com",
  phone: "숫자와 -만, 숫자 8~11개",
  password: (minLength: number | null, maxLength: number | null) =>
    `영문과 숫자를 모두 넣어 ${minLength}~${maxLength}자`,
} as const;
