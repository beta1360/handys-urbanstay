import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatStayPeriod } from "@/entities/stay";
import {
  API_ERROR_CODES,
  ApiResponseError,
  createStay,
  fetchHotelRoomTypes,
} from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { STAY_RESERVE_LABELS, STAY_RESERVE_MESSAGES } from "../config/messages";
import { StayReserve } from "./stay-reserve";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchHotelRoomTypes: vi.fn(),
  createStay: vi.fn(),
}));

const HOTEL_ID = 3;

const CRITERIA = {
  checkInDate: "2026-11-13",
  checkOutDate: "2026-11-15",
  guestCount: 2,
};

const DELUXE = { type: "디럭스", roomCount: 2, maxGuests: 4, availableCount: 0 };

const STANDARD = {
  type: "스탠다드",
  roomCount: 3,
  maxGuests: 2,
  availableCount: 2,
};

const GUEST = {
  name: "김이용",
  phone: "010-1234-5678",
  email: "guest@example.com",
};

const SEARCH_CHILD = "검색 폼 자리";

function renderStayReserve() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={queryClient}>
      <StayReserve hotelId={HOTEL_ID}>
        <p>{SEARCH_CHILD}</p>
      </StayReserve>
    </QueryClientProvider>,
  );
  return { user };
}

async function selectStandardAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(
    await screen.findByRole("radio", { name: new RegExp(STANDARD.type) }),
  );
  await user.type(
    screen.getByLabelText(STAY_RESERVE_LABELS.guestName),
    GUEST.name,
  );
  await user.type(
    screen.getByLabelText(STAY_RESERVE_LABELS.guestPhone),
    GUEST.phone,
  );
  await user.type(
    screen.getByLabelText(STAY_RESERVE_LABELS.guestEmail),
    GUEST.email,
  );
  await user.click(
    screen.getByRole("button", { name: STAY_RESERVE_MESSAGES.submit }),
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-31T03:00:00Z"));
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams({ ...CRITERIA, guestCount: "2" }) as never,
  );
  vi.mocked(fetchHotelRoomTypes).mockResolvedValue([DELUXE, STANDARD]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("StayReserve", () => {
  it("URL의 조건으로 유형을 조회하고 남은 객실이 없는 유형은 고를 수 없다", async () => {
    renderStayReserve();

    const standard = await screen.findByRole("radio", {
      name: new RegExp(STANDARD.type),
    });
    const deluxe = screen.getByRole("radio", { name: new RegExp(DELUXE.type) });
    expect(fetchHotelRoomTypes).toHaveBeenCalledWith(
      HOTEL_ID,
      CRITERIA,
      expect.anything(),
    );
    expect(standard).toBeEnabled();
    expect(deluxe).toBeDisabled();
    expect(screen.getByText(SEARCH_CHILD)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(STAY_RESERVE_LABELS.guestName),
    ).not.toBeInTheDocument();
  });

  it("유형을 골라 예약하면 같은 화면에서 호수 없이 예약 내용을 보여주고 제목에 초점을 옮긴다", async () => {
    vi.mocked(createStay).mockResolvedValue({
      data: {
        id: 11,
        hotel: { id: HOTEL_ID, name: "어반스테이 강남" },
        roomType: STANDARD.type,
        ...CRITERIA,
        guest: { name: GUEST.name },
      },
      message: "예약을 완료했습니다.",
    });
    const { user } = renderStayReserve();

    await selectStandardAndSubmit(user);

    const heading = await screen.findByRole("heading", {
      name: "예약을 완료했습니다.",
    });
    expect(heading).toHaveFocus();
    expect(vi.mocked(createStay).mock.calls[0][0]).toEqual({
      hotelId: HOTEL_ID,
      roomType: STANDARD.type,
      ...CRITERIA,
      guest: GUEST,
    });
    expect(
      screen.getAllByRole("definition").map((detail) => detail.textContent),
    ).toEqual([
      "어반스테이 강남",
      STANDARD.type,
      formatStayPeriod(CRITERIA),
      COMMON_MESSAGES.people(CRITERIA.guestCount),
      GUEST.name,
    ]);
    expect(screen.queryByText(SEARCH_CHILD)).not.toBeInTheDocument();
  });

  it("그사이 빈 객실이 없어지면 폼 알림에 서버 문구를 보여주고 유형 목록을 다시 조회한다", async () => {
    vi.mocked(createStay).mockRejectedValue(
      new ApiResponseError("createStay", 409, {
        code: API_ERROR_CODES.roomTypeUnavailable,
        message: "선택한 기간과 인원으로 예약할 수 있는 객실이 없습니다.",
        fieldErrors: [],
      }),
    );
    const { user } = renderStayReserve();
    await screen.findByRole("radio", { name: new RegExp(STANDARD.type) });
    vi.mocked(fetchHotelRoomTypes).mockResolvedValue([
      DELUXE,
      { ...STANDARD, availableCount: 0 },
    ]);

    await selectStandardAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "선택한 기간과 인원으로 예약할 수 있는 객실이 없습니다.",
    );
    await waitFor(() =>
      expect(
        screen.getByRole("radio", { name: new RegExp(STANDARD.type) }),
      ).toBeDisabled(),
    );
    expect(fetchHotelRoomTypes).toHaveBeenCalledTimes(2);
  });

  it("400 fieldErrors는 경로가 같은 이용객 칸에 서버 문구로 보여준다", async () => {
    vi.mocked(createStay).mockRejectedValue(
      new ApiResponseError("createStay", 400, {
        code: API_ERROR_CODES.invalidInput,
        message: "입력값이 올바르지 않습니다.",
        fieldErrors: [
          { field: "guest.phone", message: "전화번호 형식이 올바르지 않습니다." },
        ],
      }),
    );
    const { user } = renderStayReserve();

    await selectStandardAndSubmit(user);

    const phone = screen.getByLabelText(STAY_RESERVE_LABELS.guestPhone);
    await waitFor(() => expect(phone).toHaveAttribute("aria-invalid", "true"));
    expect(
      screen.getByText("전화번호 형식이 올바르지 않습니다."),
    ).toBeInTheDocument();
    expect(phone).toHaveFocus();
  });
});
