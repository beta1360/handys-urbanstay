import { MutationObserver } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequestValidationError, ResponseValidationError } from "@/shared/api";
import { queryClient } from "./query-client";

const ATTEMPTS_WITHOUT_RETRY = 1;
const ATTEMPTS_WITH_DEFAULT_RETRY = 4;

function createAxiosError(status: number) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_RESPONSE,
    config,
    undefined,
    { data: null, status, statusText: "", headers: {}, config },
  );
}

async function countQueryAttempts(error: Error) {
  const queryFn = vi.fn().mockRejectedValue(error);

  await expect(
    queryClient.fetchQuery({ queryKey: ["retry"], queryFn, retryDelay: 0 }),
  ).rejects.toBe(error);

  return queryFn.mock.calls.length;
}

afterEach(() => {
  queryClient.clear();
});

describe("queryClient", () => {
  it("요청 검증 오류는 재시도하지 않는다", async () => {
    await expect(
      countQueryAttempts(new RequestValidationError("test", [])),
    ).resolves.toBe(ATTEMPTS_WITHOUT_RETRY);
  });

  it("응답 검증 오류는 재시도하지 않는다", async () => {
    await expect(
      countQueryAttempts(new ResponseValidationError("test", [])),
    ).resolves.toBe(ATTEMPTS_WITHOUT_RETRY);
  });

  it.each([400, 401, 403, 404, 409])(
    "%i 응답 오류는 재시도하지 않는다",
    async (status) => {
      await expect(countQueryAttempts(createAxiosError(status))).resolves.toBe(
        ATTEMPTS_WITHOUT_RETRY,
      );
    },
  );

  it.each([500, 502, 503])(
    "%i 응답 오류는 세 번까지 재시도한다",
    async (status) => {
      await expect(countQueryAttempts(createAxiosError(status))).resolves.toBe(
        ATTEMPTS_WITH_DEFAULT_RETRY,
      );
    },
  );

  it("응답이 없는 네트워크 오류는 세 번까지 재시도한다", async () => {
    await expect(
      countQueryAttempts(
        new AxiosError("Network Error", AxiosError.ERR_NETWORK),
      ),
    ).resolves.toBe(ATTEMPTS_WITH_DEFAULT_RETRY);
  });

  it("뮤테이션은 실패해도 재시도하지 않는다", async () => {
    const error = createAxiosError(500);
    const mutationFn = vi.fn<() => Promise<never>>().mockRejectedValue(error);
    const observer = new MutationObserver(queryClient, { mutationFn });

    await expect(observer.mutate()).rejects.toBe(error);
    expect(mutationFn).toHaveBeenCalledTimes(ATTEMPTS_WITHOUT_RETRY);
  });
});
