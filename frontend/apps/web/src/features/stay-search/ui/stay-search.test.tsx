import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STAY_LABELS, STAY_VALIDATION_MESSAGES } from "@/entities/stay";
import { STAY_SEARCH_MESSAGES } from "../config/messages";
import { StaySearch } from "./stay-search";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

let pushState: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-31T03:00:00Z"));
  pushState = vi
    .spyOn(window.history, "pushState")
    .mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("StaySearch", () => {
  it("URL의 검색 조건을 입력창에 채운다", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams(
        "checkInDate=2026-11-02&checkOutDate=2026-11-04&guestCount=2",
      ) as never,
    );

    render(<StaySearch />);

    expect(screen.getByLabelText(STAY_LABELS.checkInDate)).toHaveValue(
      "2026-11-02",
    );
    expect(screen.getByLabelText(STAY_LABELS.checkOutDate)).toHaveValue(
      "2026-11-04",
    );
    expect(screen.getByLabelText(STAY_LABELS.guestCount)).toHaveValue("2");
  });

  it("맞는 조건을 제출하면 URL search에 반영한다", async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as never);
    const user = userEvent.setup();
    render(<StaySearch />);

    await user.type(screen.getByLabelText(STAY_LABELS.checkInDate), "2026-11-02");
    await user.type(
      screen.getByLabelText(STAY_LABELS.checkOutDate),
      "2026-11-04",
    );
    await user.type(screen.getByLabelText(STAY_LABELS.guestCount), "2");
    await user.click(
      screen.getByRole("button", { name: STAY_SEARCH_MESSAGES.submit }),
    );

    expect(pushState).toHaveBeenCalledWith(
      null,
      "",
      "?checkInDate=2026-11-02&checkOutDate=2026-11-04&guestCount=2",
    );
  });

  it("체크아웃이 체크인보다 앞서면 URL을 바꾸지 않고 체크아웃 칸에 오류를 보여준다", async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as never);
    const user = userEvent.setup();
    render(<StaySearch />);

    await user.type(screen.getByLabelText(STAY_LABELS.checkInDate), "2026-11-04");
    await user.type(
      screen.getByLabelText(STAY_LABELS.checkOutDate),
      "2026-11-02",
    );
    await user.type(screen.getByLabelText(STAY_LABELS.guestCount), "2");
    await user.click(
      screen.getByRole("button", { name: STAY_SEARCH_MESSAGES.submit }),
    );

    const checkOut = screen.getByLabelText(STAY_LABELS.checkOutDate);
    expect(checkOut).toHaveAccessibleDescription(
      STAY_VALIDATION_MESSAGES.afterCheckIn,
    );
    expect(checkOut).toHaveFocus();
    expect(pushState).not.toHaveBeenCalled();
  });
});
