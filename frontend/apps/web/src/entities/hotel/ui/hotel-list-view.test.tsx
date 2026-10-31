import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ROUTES } from "@/shared/config";
import { HotelListView } from "./hotel-list-view";

const HOTELS = [
  { id: 1, name: "어반스테이 강남", address: "서울 강남구 테헤란로 1" },
  { id: 2, name: "어반스테이 부산", address: "부산 해운대구 해운대로 2" },
];

describe("HotelListView", () => {
  it("호텔마다 이름과 주소를 보여주고 그 호텔의 객실 목록으로 가는 링크를 둔다", () => {
    render(<HotelListView hotels={HOTELS} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(HOTELS.length);
    HOTELS.forEach((hotel, index) => {
      expect(links[index]).toHaveTextContent(hotel.name);
      expect(links[index]).toHaveTextContent(hotel.address);
      expect(links[index]).toHaveAttribute(
        "href",
        ROUTES.hotelRooms(hotel.id),
      );
    });
  });
});
