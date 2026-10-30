import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchHotels } from "@/shared/api";
import type { HotelListParams, HotelPage } from "@/shared/api";
import { useHotelListQuery } from "./hotel-list-query";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchHotels: vi.fn(),
}));

function createHotelPage(page: number, totalPages: number): HotelPage {
  return { items: [], page, size: 10, totalElements: 0, totalPages };
}

function renderHotelListQuery(initialParams: HotelListParams) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook((params: HotelListParams) => useHotelListQuery(params), {
    initialProps: initialParams,
    wrapper,
  });
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("useHotelListQuery", () => {
  it("파라미터와 signal을 넘겨 목록을 조회한다", async () => {
    const hotelPage = createHotelPage(0, 1);
    vi.mocked(fetchHotels).mockResolvedValue(hotelPage);

    const { result } = renderHotelListQuery({ page: 0 });

    await waitFor(() => {
      expect(result.current.data).toEqual(hotelPage);
    });
    expect(fetchHotels).toHaveBeenCalledExactlyOnceWith(
      { page: 0 },
      { signal: expect.any(AbortSignal) },
    );
  });

  it.each([
    {
      name: "마지막 페이지 안의 이전 목록은 그대로 보여준다",
      previousPage: createHotelPage(1, 3),
      placeholder: createHotelPage(1, 3),
    },
    {
      name: "마지막 페이지를 넘은 이전 응답은 보여주지 않는다",
      previousPage: createHotelPage(5, 3),
      placeholder: undefined,
    },
  ])("페이지를 옮기는 동안 $name", async ({ previousPage, placeholder }) => {
    vi.mocked(fetchHotels)
      .mockResolvedValueOnce(previousPage)
      .mockReturnValueOnce(new Promise<never>(() => {}));
    const { result, rerender } = renderHotelListQuery({
      page: previousPage.page,
    });
    await waitFor(() => {
      expect(result.current.data).toEqual(previousPage);
    });

    rerender({ page: 2 });

    await waitFor(() => {
      expect(fetchHotels).toHaveBeenCalledTimes(2);
    });
    expect(result.current.data).toEqual(placeholder);
    expect(result.current.isPlaceholderData).toBe(placeholder !== undefined);
  });
});
