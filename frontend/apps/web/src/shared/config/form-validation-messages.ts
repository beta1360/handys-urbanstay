export const FORM_VALIDATION_MESSAGES = {
  required: "필수 입력입니다.",
  maxLength: (maxLength: number) => `${maxLength}자 이하로 입력해 주세요.`,
  phoneFormat: "전화번호 형식이 올바르지 않습니다.",
  emailFormat: "이메일 형식이 올바르지 않습니다.",
  typeMismatch: "형식이 올바르지 않습니다.",
  min: (value: number) => `${value} 이상이어야 합니다.`,
  max: (value: number) => `${value} 이하여야 합니다.`,
} as const;
