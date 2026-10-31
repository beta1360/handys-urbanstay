export const HOTEL_MASTER_FIELD_LABELS = {
  name: "이름",
  loginId: "아이디",
} as const;

export const HOTEL_MASTER_LOAD_MESSAGES = {
  loadFailed: "마스터 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const;

export const HOTEL_MASTER_INFO_MESSAGES = {
  legend: "마스터 계정",
  edit: "마스터 정보 수정",
  loginIdLabel: "아이디(이메일)",
  loginIdHint: "이메일 형식. 마스터가 hotel-admin에 로그인할 때 씁니다.",
  passwordHint: (minLength: number | null, maxLength: number | null) =>
    `영문과 숫자를 모두 넣어 ${minLength}~${maxLength}자`,
} as const;
