import type { RoomStatus } from "@/shared/api";

export const ROOM_FIELD_LABELS = {
  room: "객실",
  name: "호실",
  type: "유형",
  floor: "층",
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
} as const;
