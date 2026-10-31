import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatStayPeriod } from "@/entities/stay";
import {
  API_ERROR_CODES,
  ApiResponseError,
  createStay,
  fetchHotelRoomTypes,
  fetchMe,
} from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { loginHref } from "@/shared/lib/login-redirect";
import { STAY_RESERVE_MESSAGES } from "../config/messages";
import { StayReserve } from "./stay-reserve";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchHotelRoomTypes: vi.fn(),
  fetchMe: vi.fn(),
  createStay: vi.fn(),
}));

const HOTEL_ID = 3;

const HOTEL_PATH = `/hotels/${HOTEL_ID}`;

const CRITERIA = {
  checkInDate: "2026-11-13",
  checkOutDate: "2026-11-15",
  guestCount: 2,
};

const SEARCH = new URLSearchParams({ ...CRITERIA, guestCount: "2" });

const ROOM_TYPE_TIMES = { checkInTime: "15:00", checkOutTime: "11:00" };

const DELUXE = {
  id: 1,
  name: "디럭스",
  capacity: 4,
  roomRate: 150000,
  ...ROOM_TYPE_TIMES,
  roomCount: 2,
  availableCount: 0,
};

const STANDARD = {
  id: 2,
  name: "스탠다드",
  capacity: 2,
  roomRate: 90000,
  ...ROOM_TYPE_TIMES,
  roomCount: 3,
  availableCount: 2,
};

const MEMBER = {
  id: 1,
  email: "guest@example.com",
  name: "김회원",
  phone: "010-1234-5678",
};

const SEARCH_CHILD = "검색 폼 자리";

function unauthorizedError(operation: string) {
  return new ApiResponseError(operation, 401, {
    code: API_ERROR_CODES.unauthorized,
    message: "로그인이 필요합니다.",
    fieldErrors: [],
  });
}

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

async function selectStandard(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole("radio", { name: new RegExp(STANDARD.name) }),
  );
}

async function selectStandardAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
) {
  await selectStandard(user);
  const submit = await screen.findByRole("button", {
    name: STAY_RESERVE_MESSAGES.submit,
  });
  await waitFor(() => expect(submit).toBeEnabled());
  await user.click(submit);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-31T03:00:00Z"));
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(usePathname).mockReturnValue(HOTEL_PATH);
  vi.mocked(useSearchParams).mockReturnValue(SEARCH as never);
  vi.mocked(fetchHotelRoomTypes).mockResolvedValue([DELUXE, STANDARD]);
  vi.mocked(fetchMe).mockResolvedValue(MEMBER);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("StayReserve", () => {
  it("URL의 조건으로 유형을 조회해 1박 요금을 보여주고 남은 객실이 없는 유형은 고를 수 없다", async () => {
    renderStayReserve();

    const standard = await screen.findByRole("radio", {
      name: new RegExp(STANDARD.name),
    });
    const deluxe = screen.getByRole("radio", { name: new RegExp(DELUXE.name) });
    expect(fetchHotelRoomTypes).toHaveBeenCalledWith(
      HOTEL_ID,
      CRITERIA,
      expect.anything(),
    );
    expect(standard).toBeEnabled();
    expect(deluxe).toBeDisabled();
    expect(standard.closest("label")).toHaveTextContent(
      COMMON_MESSAGES.won("90,000"),
    );
    expect(screen.getByText(SEARCH_CHILD)).toBeInTheDocument();
  });

  it("로그인하지 않았으면 예약 내용과 금액을 보여주고 예약 버튼 대신 지금 주소로 돌아오는 로그인 링크를 보여준다", async () => {
    vi.mocked(fetchMe).mockRejectedValue(unauthorizedError("getMe"));
    const { user } = renderStayReserve();

    await selectStandard(user);

    expect(
      await screen.findByRole("link", {
        name: STAY_RESERVE_MESSAGES.loginToReserve,
      }),
    ).toHaveAttribute("href", loginHref(`${HOTEL_PATH}?${SEARCH.toString()}`));
    expect(
      screen.queryByRole("button", { name: STAY_RESERVE_MESSAGES.submit }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("definition").map((detail) => detail.textContent),
    ).toEqual([
      STANDARD.name,
      formatStayPeriod(CRITERIA),
      COMMON_MESSAGES.people(CRITERIA.guestCount),
      COMMON_MESSAGES.won("90,000"),
      COMMON_MESSAGES.won("180,000"),
    ]);
  });

  it("회원이 예약하면 유형 ID로 요청하고 같은 화면에서 최종 금액과 함께 예약 내용을 보여준다", async () => {
    vi.mocked(createStay).mockResolvedValue({
      data: {
        id: 11,
        hotel: { id: HOTEL_ID, name: "어반스테이 강남" },
        roomType: { id: STANDARD.id, name: STANDARD.name },
        ...CRITERIA,
        roomRate: STANDARD.roomRate,
        nights: 2,
        baseAmount: 180000,
        discountAmount: 0,
        totalAmount: 180000,
        guest: { name: MEMBER.name },
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
      roomTypeId: STANDARD.id,
      ...CRITERIA,
    });
    expect(
      screen.getAllByRole("definition").map((detail) => detail.textContent),
    ).toEqual([
      "어반스테이 강남",
      STANDARD.name,
      formatStayPeriod(CRITERIA),
      COMMON_MESSAGES.people(CRITERIA.guestCount),
      MEMBER.name,
      COMMON_MESSAGES.won("180,000"),
    ]);
    expect(screen.queryByText(SEARCH_CHILD)).not.toBeInTheDocument();
  });

  it("예약 중 로그인이 끊기면 폼 알림에 서버 문구를 보여주고 로그인 링크로 바꾼다", async () => {
    vi.mocked(createStay).mockRejectedValue(unauthorizedError("createStay"));
    const { user } = renderStayReserve();

    await selectStandardAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "로그인이 필요합니다.",
    );
    expect(
      await screen.findByRole("link", {
        name: STAY_RESERVE_MESSAGES.loginToReserve,
      }),
    ).toBeInTheDocument();
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
    await screen.findByRole("radio", { name: new RegExp(STANDARD.name) });
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
        screen.getByRole("radio", { name: new RegExp(STANDARD.name) }),
      ).toBeDisabled(),
    );
    expect(fetchHotelRoomTypes).toHaveBeenCalledTimes(2);
  });
});
