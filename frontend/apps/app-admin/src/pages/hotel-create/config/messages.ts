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
} as const;
