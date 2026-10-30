export const FORM_VALIDATION_MESSAGES = {
  required: "필수 입력입니다.",
  maxLength: (maxLength: number) => `${maxLength}자 이하로 입력해 주세요.`,
  phoneFormat: "전화번호 형식이 올바르지 않습니다.",
  emailFormat: "이메일 형식이 올바르지 않습니다.",
  passwordRule: (minLength: number | null, maxLength: number | null) =>
    `영문과 숫자를 모두 넣어 ${minLength}~${maxLength}자로 입력해 주세요. 특수문자는 쓸 수 있고 한글은 쓸 수 없습니다.`,
} as const;
