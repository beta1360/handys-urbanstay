export const ACCOUNT_FORM_MESSAGES = {
  loginIdLabel: "아이디(이메일)",
  initialPasswordLabel: "처음 비밀번호",
  passwordHint: (minLength: number | null, maxLength: number | null) =>
    `영문과 숫자를 모두 넣어 ${minLength}~${maxLength}자`,
} as const;
