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
