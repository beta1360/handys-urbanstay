import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  getMembersQueryPageDefault,
  getMembersQuerySizeDefault,
  getMemberStaysQuerySizeDefault,
} from "./generated/zod";
import {
  fetchMember,
  fetchMembers,
  fetchMemberStays,
  memberListQueryKey,
  memberQueryKey,
  memberStayListQueryKey,
} from "./member";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getMembers: vi.fn(),
  getMember: vi.fn(),
  getMemberStays: vi.fn(),
}));

const MEMBER_ID = 3;

const MEMBER = {
  id: MEMBER_ID,
  email: "guest@example.com",
  name: "김회원",
  phone: "010-1234-5678",
  createdAt: "2026-10-30T06:59:32.123456Z",
};

const STAY = {
  id: 11,
  hotel: { id: 1, name: "어반스테이 강남" },
  room: { id: 5, name: "101" },
  roomType: { id: 2, name: "스탠다드" },
  checkInDate: "2026-11-02",
  checkOutDate: "2026-11-04",
  guestCount: 2,
  roomRate: 100000,
  nights: 2,
  baseAmount: 200000,
  discountAmount: 0,
  totalAmount: 200000,
  canceledAt: null,
};

function toPage<T>(items: T[]) {
  return { items, page: 0, size: 10, totalElements: items.length, totalPages: 1 };
}

function toResponse<T>(data: T) {
  return { success: true, data, message: null, error: null };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("fetchMembers", () => {
  it("검색어·페이지와 signal을 넘겨 목록 페이지를 돌려준다", async () => {
    vi.mocked(generated.getMembers).mockResolvedValue(
      toResponse(toPage([MEMBER])),
    );
    const { signal } = new AbortController();

    await expect(
      fetchMembers({ keyword: "01012345678", page: 1 }, { signal }),
    ).resolves.toEqual(toPage([MEMBER]));
    expect(generated.getMembers).toHaveBeenCalledWith(
      {
        keyword: "01012345678",
        page: 1,
        size: getMembersQuerySizeDefault,
      },
      undefined,
      signal,
    );
  });

  it("빠진 page·size는 스키마 기본값을 채워 보낸다", async () => {
    vi.mocked(generated.getMembers).mockResolvedValue(toResponse(toPage([])));

    await fetchMembers({});

    expect(generated.getMembers).toHaveBeenCalledWith(
      { page: getMembersQueryPageDefault, size: getMembersQuerySizeDefault },
      undefined,
      undefined,
    );
  });

  it.each([
    ["page가 범위를 넘으면", { page: 100 }],
    ["keyword가 100자를 넘으면", { keyword: "a".repeat(101) }],
  ])("%s 요청을 보내지 않고 요청 검증 오류를 던진다", async (_, params) => {
    await expect(fetchMembers(params)).rejects.toBeInstanceOf(
      RequestValidationError,
    );
    expect(generated.getMembers).not.toHaveBeenCalled();
  });
});

describe("fetchMember", () => {
  it("회원 ID와 signal을 넘겨 회원을 돌려주고 모르는 필드는 버린다", async () => {
    vi.mocked(generated.getMember).mockResolvedValue(
      toResponse({ ...MEMBER, version: 0 }),
    );
    const { signal } = new AbortController();

    await expect(fetchMember(MEMBER_ID, { signal })).resolves.toEqual(MEMBER);
    expect(generated.getMember).toHaveBeenCalledWith(
      MEMBER_ID,
      undefined,
      signal,
    );
  });

  it.each([
    ["data가 null이면", toResponse(null)],
    ["필드가 빠지면", toResponse({ ...MEMBER, createdAt: undefined })],
  ])("%s 응답 검증 오류를 던진다", async (_, response) => {
    vi.mocked(generated.getMember).mockResolvedValue(response as never);

    await expect(fetchMember(MEMBER_ID)).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});

describe("fetchMemberStays", () => {
  it("회원 ID·페이지와 signal을 넘겨 이용 기록 페이지를 돌려준다", async () => {
    vi.mocked(generated.getMemberStays).mockResolvedValue(
      toResponse(toPage([STAY])),
    );
    const { signal } = new AbortController();

    await expect(
      fetchMemberStays(MEMBER_ID, { page: 2 }, { signal }),
    ).resolves.toEqual(toPage([STAY]));
    expect(generated.getMemberStays).toHaveBeenCalledWith(
      MEMBER_ID,
      { page: 2, size: getMemberStaysQuerySizeDefault },
      undefined,
      signal,
    );
  });

  it("page가 범위를 넘으면 요청을 보내지 않는다", async () => {
    await expect(
      fetchMemberStays(MEMBER_ID, { page: 100 }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.getMemberStays).not.toHaveBeenCalled();
  });

  it("항목의 금액이 빠지면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.getMemberStays).mockResolvedValue(
      toResponse(toPage([{ ...STAY, totalAmount: undefined }])) as never,
    );

    await expect(fetchMemberStays(MEMBER_ID, {})).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});

describe("회원 쿼리 키", () => {
  it("요청 경로를 따른다", () => {
    expect(memberListQueryKey()).toEqual(["/api/v1/app-admin/members"]);
    expect(memberListQueryKey({ page: 1 })).toEqual([
      "/api/v1/app-admin/members",
      { page: 1 },
    ]);
    expect(memberQueryKey(MEMBER_ID)).toEqual([
      `/api/v1/app-admin/members/${MEMBER_ID}`,
    ]);
    expect(memberStayListQueryKey(MEMBER_ID, { page: 0 })).toEqual([
      `/api/v1/app-admin/members/${MEMBER_ID}/stays`,
      { page: 0 },
    ]);
  });
});
