import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createToastStore, TOAST_DURATION_MS } from "./toast-store";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createToastStore", () => {
  it("새 문구를 띄우면 이전 문구를 바로 바꾸고 마지막 문구에서 3초 뒤 사라진다", () => {
    const store = createToastStore();

    store.show("로그인했습니다.");
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
    store.show("로그아웃했습니다.");

    expect(store.getSnapshot()?.message).toBe("로그아웃했습니다.");
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
    expect(store.getSnapshot()?.message).toBe("로그아웃했습니다.");
    vi.advanceTimersByTime(1);
    expect(store.getSnapshot()).toBeNull();
  });

  it("같은 문구를 다시 띄워도 새 알림으로 구독자에게 알린다", () => {
    const store = createToastStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.show("로그인했습니다.");
    const first = store.getSnapshot();
    store.show("로그인했습니다.");

    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot()?.id).not.toBe(first?.id);
  });
});
