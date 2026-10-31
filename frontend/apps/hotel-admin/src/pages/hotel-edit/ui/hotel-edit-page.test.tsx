import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { showToast } from "@repo/admin-kit/toast";
import {
  HOTEL_FIELD_LABELS,
  HOTEL_INFO_FIELDS,
  HOTEL_INFO_MESSAGES,
} from "@/entities/hotel";
import type { HotelInfoField } from "@/entities/hotel";
import {
  API_ERROR_CODES,
  hotelQueryKey,
  meQueryKey,
  updateHotel,
} from "@/shared/api";
import type { Account, Hotel } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { HotelEditPage } from "./hotel-edit-page";

const { fetchHotel } = vi.hoisted(() => ({ fetchHotel: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  updateHotel: vi.fn(),
  fetchHotel: () => fetchHotel(),
}));

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
}));

const DETAIL_PAGE_TEXT = "호텔 정보 화면";

const UPDATE_MESSAGE = "호텔 정보를 수정했습니다.";

const HOTEL: Hotel = {
  id: 1,
  name: "어반스테이 강남",
  address: "서울특별시 강남구 테헤란로 123",
  phone: "02-1234-5678",
  description: "강남역에서 걸어서 5분 거리입니다.",
  version: 2,
};

const LATEST_HOTEL: Hotel = {
  ...HOTEL,
  name: "어반스테이 강남역",
  description: null,
  version: 3,
};

const ME: Account = {
  id: 1,
  loginId: "master@urbanstay.com",
  name: "홍길동",
  role: "MASTER",
  hotel: { id: HOTEL.id, name: HOTEL.name },
};

function createApiError(status: number, code: string, message: string) {
  const config = { headers: new AxiosHeaders() };
  const data = {
    success: false,
    data: null,
    message: null,
    error: { code, message, fieldErrors: [] },
  };
  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status, statusText: "", headers: {}, config },
  );
}

async function renderLoadedHotelEditPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(meQueryKey(), ME);
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const hotelRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "hotel",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        hotelRoute.addChildren([
          createRoute({
            getParentRoute: () => hotelRoute,
            path: "/",
            component: () => <p>{DETAIL_PAGE_TEXT}</p>,
          }),
          createRoute({
            getParentRoute: () => hotelRoute,
            path: "edit",
            component: HotelEditPage,
          }),
        ]),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: ["/hotel", "/hotel/edit"],
      initialIndex: 1,
    }),
    parseSearch,
    stringifySearch,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findByRole("group", { name: HOTEL_INFO_MESSAGES.legend });
  return { router, queryClient, user: userEvent.setup() };
}

function getFields(): Record<HotelInfoField, HTMLElement> {
  const group = within(
    screen.getByRole("group", { name: HOTEL_INFO_MESSAGES.legend }),
  );
  return {
    name: group.getByLabelText(HOTEL_FIELD_LABELS.name),
    address: group.getByLabelText(HOTEL_FIELD_LABELS.address),
    phone: group.getByLabelText(HOTEL_FIELD_LABELS.phone),
    description: group.getByLabelText(
      `${HOTEL_FIELD_LABELS.description} ${HOTEL_INFO_MESSAGES.optional}`,
    ),
  };
}

function expectFormValues(hotel: Hotel) {
  const fields = getFields();
  for (const field of HOTEL_INFO_FIELDS) {
    expect(fields[field]).toHaveValue(hotel[field] ?? "");
  }
}

function getSubmitButton() {
  return screen.getByRole("button", { name: COMMON_MESSAGES.save });
}

function queryReloadButton() {
  return screen.queryByRole("button", { name: COMMON_MESSAGES.reload });
}

async function replaceValue(
  user: UserEvent,
  field: HotelInfoField,
  value: string,
) {
  await user.clear(getFields()[field]);
  if (value !== "") {
    await user.paste(value);
  }
}

beforeEach(() => {
  fetchHotel.mockResolvedValue(HOTEL);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("HotelEditPage", () => {
  it("호텔 정보로 폼을 채우고, 앞뒤 공백을 지운 값과 version으로 저장한 뒤 서버 문구를 토스트로 띄우고 내 정보를 무효화하며 방문 기록을 바꿔 호텔 정보로 이동한다", async () => {
    const updatedHotel = { ...LATEST_HOTEL, version: HOTEL.version + 1 };
    vi.mocked(updateHotel).mockResolvedValue({
      data: updatedHotel,
      message: UPDATE_MESSAGE,
    });
    const { router, queryClient, user } = await renderLoadedHotelEditPage();
    expectFormValues(HOTEL);
    expect(getFields().phone).toHaveAccessibleDescription(
      HOTEL_INFO_MESSAGES.phoneHint,
    );

    await replaceValue(user, "name", `  ${LATEST_HOTEL.name}  `);
    await replaceValue(user, "description", "   ");
    await user.click(getSubmitButton());

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(updateHotel).toHaveBeenCalledExactlyOnceWith({
      name: LATEST_HOTEL.name,
      address: HOTEL.address,
      phone: HOTEL.phone,
      description: null,
      version: HOTEL.version,
    });
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      message: UPDATE_MESSAGE,
    });
    expect(router.state.location.href).toBe("/hotel");
    expect(router.history.length).toBe(2);
    expect(queryClient.getQueryData(hotelQueryKey())).toEqual(updatedHotel);
    expect(queryClient.getQueryState(meQueryKey())?.isInvalidated).toBe(true);
  });

  it("다른 사용자가 먼저 수정했다는 응답이면 알림과 최신 내용 불러오기를 보여주고, 누르면 최신 값으로 다시 채운 뒤 새 version으로 저장한다", async () => {
    const message = "다른 사용자가 먼저 수정했습니다.";
    vi.mocked(updateHotel).mockRejectedValueOnce(
      createApiError(409, API_ERROR_CODES.hotelModified, message),
    );
    const { user } = await renderLoadedHotelEditPage();

    await replaceValue(user, "name", "입력한 이름");
    await user.click(getSubmitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(showToast).not.toHaveBeenCalled();
    expect(getFields().name).toHaveValue("입력한 이름");

    fetchHotel.mockResolvedValue(LATEST_HOTEL);
    vi.mocked(updateHotel).mockReturnValue(new Promise<never>(() => {}));
    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.reload }),
    );

    await vi.waitFor(() => {
      expectFormValues(LATEST_HOTEL);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await vi.waitFor(() => {
      expect(getFields().name).toHaveFocus();
    });

    await user.click(getSubmitButton());

    expect(vi.mocked(updateHotel).mock.lastCall?.[0]).toMatchObject({
      name: LATEST_HOTEL.name,
      description: null,
      version: LATEST_HOTEL.version,
    });
  });

  it("같은 이름·주소의 호텔이 있다는 응답이면 서버 문구를 폼 안이 아닌 오류 토스트로 보여주고 입력한 내용은 그대로 둔다", async () => {
    const message = "같은 이름과 주소의 호텔이 이미 있습니다.";
    vi.mocked(updateHotel).mockRejectedValue(
      createApiError(409, API_ERROR_CODES.hotelDuplicated, message),
    );
    const { user } = await renderLoadedHotelEditPage();

    await user.click(getSubmitButton());

    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        message,
      });
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(queryReloadButton()).not.toBeInTheDocument();
    expect(getFields().name).not.toHaveAttribute("aria-invalid");
    expectFormValues(HOTEL);
  });
});
