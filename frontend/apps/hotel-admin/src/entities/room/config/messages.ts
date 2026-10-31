import type { RoomStatus } from "@/shared/api";

export const ROOM_FIELD_LABELS = {
  name: "이름",
  type: "유형",
  capacity: "최대 인원",
  floor: "층",
  description: "소개",
  checkInTime: "체크인 시각",
  checkOutTime: "체크아웃 시각",
  status: "상태",
} as const;

export const ROOM_STATUS_LABELS = {
  VACANT: "공실",
  RESERVED: "예약됨",
  OCCUPIED: "이용중",
  MAINTENANCE: "정비중",
} as const satisfies Record<RoomStatus, string>;

export const ROOM_INFORMATION_MESSAGES = {
  emptyFloor: "층 없음",
  emptyDescription: "소개 없음",
} as const;

export const ROOM_LOAD_MESSAGES = {
  loadFailed: "객실 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const;

export const ROOM_NOT_FOUND_MESSAGES = {
  description: "객실을 찾을 수 없습니다.",
} as const;

export const ROOM_INFO_MESSAGES = {
  legend: "객실 정보",
  optional: "(선택)",
  capacityHint: (min: number | null, max: number | null) =>
    `${min}~${max}명`,
  floorHint: (min: number | null, max: number | null) =>
    `${min}~${max}. 지하는 음수`,
} as const;
