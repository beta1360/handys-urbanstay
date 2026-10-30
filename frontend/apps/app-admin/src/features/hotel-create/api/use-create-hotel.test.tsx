import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cacheSavedHotel } from "@/entities/hotel";
import { createHotel } from "@/shared/api";
import type { CreateHotelBody, Hotel } from "@/shared/api";
import { useCreateHotel } from "./use-create-hotel";

vi.mock("@/entities/hotel", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/hotel")>()),
  cacheSavedHotel: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  createHotel: vi.fn(),
}));

const HOTEL: Hotel = {
  id: 7,
  name: "어반스테이 강남",
  address: "서울특별시 강남구 테헤란로 123",
  phone: "02-1234-5678",
  description: null,
  version: 0,
};

const BODY: CreateHotelBody = {
  name: HOTEL.name,
  address: HOTEL.address,
  phone: HOTEL.phone,
  master: {
    loginId: "master@example.com",
    name: "홍길동",
    password: "urbanstay123!",
  },
};

function renderUseCreateHotel() {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(() => useCreateHotel(), { wrapper }) };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("useCreateHotel", () => {
  it("등록에 성공하면 캐시 규칙으로 응답을 캐시에 넣고 화면의 onSuccess를 부른다", async () => {
    vi.mocked(createHotel).mockResolvedValue(HOTEL);
    const onSuccess = vi.fn();
    const { result, queryClient } = renderUseCreateHotel();

    act(() => {
      result.current.create(BODY, { onSuccess });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
    expect(createHotel).toHaveBeenCalledOnce();
    expect(vi.mocked(createHotel).mock.lastCall?.[0]).toEqual(BODY);
    expect(cacheSavedHotel).toHaveBeenCalledExactlyOnceWith(queryClient, HOTEL);
    expect(onSuccess.mock.lastCall?.[0]).toEqual(HOTEL);
  });

  it("등록에 실패하면 캐시를 바꾸지 않고 화면의 onError를 부른다", async () => {
    const error = new Error("등록 실패");
    vi.mocked(createHotel).mockRejectedValue(error);
    const onError = vi.fn();
    const { result } = renderUseCreateHotel();

    act(() => {
      result.current.create(BODY, { onError });
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledOnce();
    });
    expect(onError.mock.lastCall?.[0]).toBe(error);
    expect(cacheSavedHotel).not.toHaveBeenCalled();
  });
});
