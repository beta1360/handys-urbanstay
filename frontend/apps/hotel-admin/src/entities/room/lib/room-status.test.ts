import { describe, expect, it } from "vitest";
import type { RoomStatus } from "@/shared/api";
import { ROOM_STATUS_TRANSITIONS, ROOM_STATUSES } from "./room-status";

const ALLOWED_TRANSITIONS = [
  "VACANT→RESERVED",
  "RESERVED→OCCUPIED",
  "OCCUPIED→MAINTENANCE",
  "MAINTENANCE→VACANT",
  "RESERVED→VACANT",
  "VACANT→MAINTENANCE",
];

const ALL_PAIRS = ROOM_STATUSES.flatMap((from) =>
  ROOM_STATUSES.map((to) => [from, to] as const),
);

describe("ROOM_STATUS_TRANSITIONS", () => {
  it.each(ALL_PAIRS)(
    "%s에서 %s로 바꿀 수 있는지가 도메인 규칙과 같다",
    (from, to) => {
      const nextStatuses: readonly RoomStatus[] = ROOM_STATUS_TRANSITIONS[from];

      expect(nextStatuses.includes(to)).toBe(
        ALLOWED_TRANSITIONS.includes(`${from}→${to}`),
      );
    },
  );
});
