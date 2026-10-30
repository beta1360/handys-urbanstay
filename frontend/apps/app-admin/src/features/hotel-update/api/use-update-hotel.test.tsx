import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cacheSavedHotel } from "@/entities/hotel";
import { updateHotel } from "@/shared/api";
import type { Hotel, UpdateHotelBody } from "@/shared/api";
import { useUpdateHotel } from "./use-update-hotel";

vi.mock("@/entities/hotel", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/hotel")>()),
  cacheSavedHotel: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  updateHotel: vi.fn(),
}));

const HOTEL: Hotel = {
  id: 1,
  name: "어반스테이 해운대",
  address: "부산광역시 해운대구 해운대로 456",
  phone: "051-123-4567",
  description: null,
  version: 4,
};

const BODY: UpdateHotelBody = {
  name: HOTEL.name,
  address: HOTEL.address,
  phone: HOTEL.phone,
  description: null,
  version: 3,
};

function renderUseUpdateHotel() {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return {
    queryClient,
    ...renderHook(() => useUpdateHotel(HOTEL.id), { wrapper }),
  };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("useUpdateHotel", () => {
  it("호텔 ID와 본문으로 수정하고 성공하면 캐시 규칙으로 응답을 캐시에 넣은 뒤 화면의 onSuccess를 부른다", async () => {
    vi.mocked(updateHotel).mockResolvedValue(HOTEL);
    const onSuccess = vi.fn();
    const { result, queryClient } = renderUseUpdateHotel();

    act(() => {
      result.current.update(BODY, { onSuccess });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
    expect(updateHotel).toHaveBeenCalledExactlyOnceWith(HOTEL.id, BODY);
    expect(cacheSavedHotel).toHaveBeenCalledExactlyOnceWith(queryClient, HOTEL);
    expect(onSuccess.mock.lastCall?.[0]).toEqual(HOTEL);
  });

  it("수정에 실패하면 캐시를 바꾸지 않고 화면의 onError를 부른다", async () => {
    const error = new Error("수정 실패");
    vi.mocked(updateHotel).mockRejectedValue(error);
    const onError = vi.fn();
    const { result } = renderUseUpdateHotel();

    act(() => {
      result.current.update(BODY, { onError });
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledOnce();
    });
    expect(onError.mock.lastCall?.[0]).toBe(error);
    expect(cacheSavedHotel).not.toHaveBeenCalled();
  });
});
