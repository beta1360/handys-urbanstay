import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { meQueryKey } from "@/shared/api";
import type { Account } from "@/shared/api";
import { checkMasterAccess } from "./master-guard";

const { fetchMe } = vi.hoisted(() => ({ fetchMe: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchMe,
}));

const ACCOUNT: Account = {
  id: 1,
  loginId: "master@urbanstay.com",
  name: "홍길동",
  role: "MASTER",
  hotel: { id: 1, name: "어반스테이 강남" },
};

afterEach(() => {
  vi.resetAllMocks();
});

describe("checkMasterAccess", () => {
  it.each([
    ["MASTER", true],
    ["OPERATOR", false],
  ] as const)(
    "캐시된 내 정보의 역할이 %s면 isMaster를 %s로 돌려주고 다시 조회하지 않는다",
    async (role, expected) => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(meQueryKey(), { ...ACCOUNT, role });

      await expect(checkMasterAccess(queryClient)).resolves.toEqual({
        isMaster: expected,
      });
      expect(fetchMe).not.toHaveBeenCalled();
    },
  );
});
