import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ROUTES } from "@/shared/config";
import { ROOM_LABELS, ROOM_MESSAGES } from "../config/messages";
import { RoomListView } from "./room-list-view";

const HOTEL_ID = 3;

const ROOM = {
  id: 7,
  name: "101",
  type: "스탠다드",
  capacity: 2,
  checkInTime: "15:00",
  checkOutTime: "11:00",
};

describe("RoomListView", () => {
  it("객실의 이름·유형·최대 인원·체크인·체크아웃 시각을 보여주고 예약 화면으로 가는 링크를 둔다", () => {
    render(<RoomListView hotelId={HOTEL_ID} rooms={[ROOM]} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      ROUTES.roomBooking(HOTEL_ID, ROOM.id),
    );
    expect(link).toHaveTextContent(ROOM.name);
    expect(link).toHaveTextContent(ROOM.type);
    const terms = within(link).getAllByRole("term");
    const details = within(link).getAllByRole("definition");
    expect(terms.map((term) => term.textContent)).toEqual([
      ROOM_LABELS.capacity,
      ROOM_LABELS.checkInTime,
      ROOM_LABELS.checkOutTime,
    ]);
    expect(details.map((detail) => detail.textContent)).toEqual([
      ROOM_MESSAGES.capacity(ROOM.capacity),
      ROOM.checkInTime,
      ROOM.checkOutTime,
    ]);
  });
});
