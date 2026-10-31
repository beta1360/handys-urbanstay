import { describe, expect, it } from "vitest";
import type { Room, RoomPage } from "@/shared/api";
import { isUnlistedStayRoom } from "./stay-room-options";

const ROOM: Room = {
  id: 2,
  name: "101",
  roomType: {
    id: 1,
    name: "스탠다드",
    capacity: 2,
    roomRate: 100000,
    checkInTime: "15:00",
    checkOutTime: "11:00",
  },
  floor: 1,
  description: null,
  status: "VACANT",
  currentStay: null,
  version: 0,
};

function createRoomPage(totalElements: number): RoomPage {
  return { items: [ROOM], page: 0, size: 100, totalElements, totalPages: 1 };
}

describe("isUnlistedStayRoom", () => {
  it.each([
    ["객실 목록을 모두 불러왔는데 없는 객실이면 true", createRoomPage(1), 9, true],
    ["불러온 목록에 있는 객실이면 false", createRoomPage(1), ROOM.id, false],
    ["객실 목록을 아직 불러오지 못했으면 false", undefined, 9, false],
    [
      "객실이 선택지 수보다 많아 목록이 잘렸으면 확인할 수 없으므로 false",
      createRoomPage(101),
      9,
      false,
    ],
  ])("%s", (_, roomPage, roomId, expected) => {
    expect(isUnlistedStayRoom(roomPage, roomId)).toBe(expected);
  });
});
