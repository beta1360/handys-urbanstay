export const HOTEL_CREATE_MESSAGES = {
  title: "호텔 등록",
  masterLegend: "마스터 계정",
  masterLoginIdLabel: "아이디(이메일)",
  masterLoginIdHint: "이메일 형식. 마스터가 hotel-admin에 로그인할 때 씁니다.",
  masterNameLabel: "이름",
  masterPasswordLabel: "처음 비밀번호",
  masterPasswordHint: (minLength: number | null, maxLength: number | null) =>
    `영문과 숫자를 모두 넣어 ${minLength}~${maxLength}자`,
  submit: "등록",
  cancel: "취소",
  requestFailed: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const;

export const HOTEL_INFO_MESSAGES = {
  legend: "호텔 정보",
  nameLabel: "이름",
  addressLabel: "주소",
  phoneLabel: "대표 전화번호",
  phoneHint: "숫자와 -만, 숫자 8~11개",
  descriptionLabel: "소개",
  optional: "(선택)",
} as const;

export const FORM_VALIDATION_MESSAGES = {
  required: "필수 입력입니다.",
  maxLength: (maxLength: number) => `${maxLength}자 이하로 입력해 주세요.`,
  phoneFormat: "전화번호 형식이 올바르지 않습니다.",
  emailFormat: "이메일 형식이 올바르지 않습니다.",
  passwordRule: (minLength: number | null, maxLength: number | null) =>
    `영문과 숫자를 모두 넣어 ${minLength}~${maxLength}자로 입력해 주세요. 특수문자는 쓸 수 있고 한글은 쓸 수 없습니다.`,
} as const;
