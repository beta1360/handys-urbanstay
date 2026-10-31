export const HOTEL_CREATE_FORM_MESSAGES = {
  masterPasswordLabel: "처음 비밀번호",
  masterPasswordHint: (minLength: number | null, maxLength: number | null) =>
    `영문과 숫자를 모두 넣어 ${minLength}~${maxLength}자`,
  submit: "등록",
} as const;
