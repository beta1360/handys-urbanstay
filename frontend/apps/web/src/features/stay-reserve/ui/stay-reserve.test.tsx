import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ReservedPeriods,
  STAY_LABELS,
  STAY_MESSAGES,
  STAY_VALIDATION_MESSAGES,
} from "@/entities/stay";
import {
  API_ERROR_CODES,
  ApiResponseError,
  createStay,
  fetchRoomReservedPeriods,
} from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { STAY_RESERVE_LABELS, STAY_RESERVE_MESSAGES } from "../config/messages";
import { StayReserve } from "./stay-reserve";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchRoomReservedPeriods: vi.fn(),
  createStay: vi.fn(),
}));

const ROOM = {
  id: 7,
  name: "101",
  type: "스탠다드",
  capacity: 2,
  checkInTime: "15:00",
  checkOutTime: "11:00",
};

const RESERVED_PERIOD = { checkInDate: "2026-11-10", checkOutDate: "2026-11-13" };

const GUEST = {
  name: "김이용",
  phone: "010-1234-5678",
  email: "guest@example.com",
};

const RESERVE_MESSAGE = "예약을 완료했습니다.";

function periodPage(items: (typeof RESERVED_PERIOD)[]) {
  return {
    items,
    page: 0,
    size: 100,
    totalElements: items.length,
    totalPages: 1,
  };
}

function renderStayReserve() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={queryClient}>
      <StayReserve room={ROOM}>
        <ReservedPeriods roomId={ROOM.id} />
      </StayReserve>
    </QueryClientProvider>,
  );
  return { user };
}

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  checkInDate: string,
  checkOutDate: string,
) {
  await user.type(screen.getByLabelText(STAY_LABELS.checkInDate), checkInDate);
  await user.type(
    screen.getByLabelText(STAY_LABELS.checkOutDate),
    checkOutDate,
  );
  await user.type(screen.getByLabelText(STAY_LABELS.guestCount), "2");
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
  vi.mocked(fetchRoomReservedPeriods).mockResolvedValue(
    periodPage([RESERVED_PERIOD]),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("StayReserve", () => {
  it("예약된 기간과 겹치는 기간이면 요청을 보내지 않고 체크인 날짜 칸에 겹침 오류를 보여준다", async () => {
    const { user } = renderStayReserve();

    expect(
      await screen.findByText(
        STAY_MESSAGES.period(
          RESERVED_PERIOD.checkInDate,
          RESERVED_PERIOD.checkOutDate,
        ),
      ),
    ).toBeInTheDocument();
    await fillAndSubmit(user, "2026-11-12", "2026-11-14");

    const checkIn = screen.getByLabelText(STAY_LABELS.checkInDate);
    expect(checkIn).toHaveAttribute("aria-invalid", "true");
    expect(checkIn).toHaveAccessibleDescription(
      STAY_VALIDATION_MESSAGES.periodOverlapped,
    );
    expect(checkIn).toHaveFocus();
    expect(createStay).not.toHaveBeenCalled();
  });

  it.each([
    [
      "409 겹침이면 체크인 날짜 칸",
      new ApiResponseError("createStay", 409, {
        code: API_ERROR_CODES.stayPeriodOverlapped,
        message: "같은 객실에 기간이 겹치는 이용이 이미 있습니다.",
        fieldErrors: [],
      }),
      STAY_LABELS.checkInDate,
      "같은 객실에 기간이 겹치는 이용이 이미 있습니다.",
    ],
    [
      "400 fieldErrors면 경로가 같은 칸",
      new ApiResponseError("createStay", 400, {
        code: API_ERROR_CODES.invalidInput,
        message: "입력값이 올바르지 않습니다.",
        fieldErrors: [
          { field: "guest.phone", message: "전화번호 형식이 올바르지 않습니다." },
        ],
      }),
      STAY_RESERVE_LABELS.guestPhone,
      "전화번호 형식이 올바르지 않습니다.",
    ],
  ])("서버 오류가 %s에 서버 문구를 보여준다", async (_, error, label, message) => {
    vi.mocked(createStay).mockRejectedValue(error);
    const { user } = renderStayReserve();

    await fillAndSubmit(user, "2026-11-13", "2026-11-15");

    const field = await screen.findByLabelText(label);
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(field).toHaveFocus();
  });

  it("오류 응답을 읽을 수 없으면 폼 알림에 일반 오류 문구를 보여준다", async () => {
    vi.mocked(createStay).mockRejectedValue(new TypeError("Failed to fetch"));
    const { user } = renderStayReserve();

    await fillAndSubmit(user, "2026-11-13", "2026-11-15");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      COMMON_MESSAGES.requestFailed,
    );
  });

  it("예약하면 완료 화면에 서버 문구와 예약 내용을 보여주고 제목에 초점을 옮긴다", async () => {
    vi.mocked(createStay).mockResolvedValue({
      data: {
        id: 11,
        hotel: { id: 3, name: "어반스테이 강남" },
        room: { id: ROOM.id, name: ROOM.name },
        checkInDate: "2026-11-13",
        checkOutDate: "2026-11-15",
        guestCount: 2,
        guest: { name: GUEST.name },
      },
      message: RESERVE_MESSAGE,
    });
    const { user } = renderStayReserve();

    await fillAndSubmit(user, "2026-11-13", "2026-11-15");

    const heading = await screen.findByRole("heading", {
      name: RESERVE_MESSAGE,
    });
    expect(heading).toHaveFocus();
    expect(vi.mocked(createStay).mock.calls[0][0]).toEqual({
      roomId: ROOM.id,
      checkInDate: "2026-11-13",
      checkOutDate: "2026-11-15",
      guestCount: 2,
      guest: GUEST,
    });
    expect(
      screen.getAllByRole("definition").map((detail) => detail.textContent),
    ).toEqual([
      "어반스테이 강남",
      ROOM.name,
      `${STAY_MESSAGES.period("2026-11-13", "2026-11-15")} (${STAY_MESSAGES.nights(2)})`,
      COMMON_MESSAGES.people(2),
      GUEST.name,
    ]);
    expect(
      screen.queryByRole("button", { name: STAY_RESERVE_MESSAGES.submit }),
    ).not.toBeInTheDocument();
  });
});
