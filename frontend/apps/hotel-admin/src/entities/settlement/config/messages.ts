export const SETTLEMENT_FIELD_LABELS = {
  totalAmount: "정산 금액",
  stayCount: "이용 건수",
  canceledCount: "취소 건수",
} as const;

export const SETTLEMENT_MONTH_MESSAGES = {
  label: (year: number, month: number) => `${year}년 ${month}월`,
} as const;
