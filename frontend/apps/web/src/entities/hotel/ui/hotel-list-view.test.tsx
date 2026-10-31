import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ROUTES } from "@/shared/config";
import { HOTEL_LIST_MESSAGES } from "../config/messages";
import { HotelListView } from "./hotel-list-view";

const GANGNAM = {
  id: 1,
  name: "어반스테이 강남",
  address: "서울 강남구 테헤란로 1",
  roomCount: 12,
  bookable: true,
};

const BUSAN = {
  id: 2,
  name: "어반스테이 부산",
  address: "부산 해운대구 해운대로 2",
  roomCount: 8,
  bookable: true,
};

const JEJU = {
  id: 3,
  name: "어반스테이 제주",
  address: "제주 제주시 연동 3",
  roomCount: 0,
  bookable: false,
};

const HOTELS = [GANGNAM, BUSAN, JEJU];

describe("HotelListView", () => {
  it("받은 순서대로 호텔마다 이름과 주소를 보여준다", () => {
    render(<HotelListView hotels={HOTELS} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(HOTELS.length);
    HOTELS.forEach((hotel, index) => {
      expect(items[index]).toHaveTextContent(hotel.name);
      expect(items[index]).toHaveTextContent(hotel.address);
    });
  });

  it("객실이 있는 호텔만 그 호텔의 예약 화면으로 가는 링크로 둔다", () => {
    render(<HotelListView hotels={HOTELS} />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      ROUTES.hotelRooms(GANGNAM.id),
      ROUTES.hotelRooms(BUSAN.id),
    ]);
  });

  it("객실이 없는 호텔은 링크 없이 예약할 수 있는 객실이 없다고 알린다", () => {
    render(<HotelListView hotels={HOTELS} />);

    const jeju = within(screen.getAllByRole("listitem")[2]);
    expect(jeju.queryByRole("link")).not.toBeInTheDocument();
    expect(jeju.getByText(HOTEL_LIST_MESSAGES.noRooms)).toBeInTheDocument();
    expect(screen.getAllByText(HOTEL_LIST_MESSAGES.noRooms)).toHaveLength(1);
  });
});
