import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { COMMON_MESSAGES } from "@/shared/config";
import { MY_STAY_MESSAGES } from "../config/messages";
import { MyStayListView } from "./my-stay-list-view";

const CANCELED_STAY = {
  id: 7,
  hotel: { id: 1, name: "어반스테이 강남" },
  roomType: { id: 2, name: "스탠다드" },
  checkInDate: "2026-11-05",
  checkOutDate: "2026-11-07",
  guestCount: 2,
  roomRate: 90000,
  nights: 2,
  baseAmount: 180000,
  discountAmount: 0,
  totalAmount: 180000,
  canceledAt: "2026-10-30T01:00:00Z",
};

describe("MyStayListView", () => {
  it("구역마다 이용의 호텔·금액·취소 여부를 보여주고 빈 구역은 없다고 알린다", () => {
    render(
      <MyStayListView sections={{ upcoming: [CANCELED_STAY], past: [] }}>
        {null}
      </MyStayListView>,
    );

    const upcoming = within(
      screen.getByRole("region", { name: MY_STAY_MESSAGES.upcomingTitle }),
    );
    expect(upcoming.getByText(CANCELED_STAY.hotel.name)).toBeInTheDocument();
    expect(upcoming.getByText(MY_STAY_MESSAGES.canceled)).toBeInTheDocument();
    expect(
      upcoming.getByText(COMMON_MESSAGES.won("180,000")),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("region", { name: MY_STAY_MESSAGES.pastTitle }),
      ).getByText(MY_STAY_MESSAGES.sectionEmpty),
    ).toBeInTheDocument();
  });
});
