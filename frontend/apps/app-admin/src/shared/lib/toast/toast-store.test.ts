import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createToastStore,
  MAX_TOASTS,
  SUCCESS_TOAST_DURATION_MS,
} from "./toast-store";

const LONG_TIME_MS = 60 * 60 * 1000;

function messagesOf(store: ReturnType<typeof createToastStore>) {
  return store.getSnapshot().map((toast) => toast.message);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createToastStore", () => {
  it("성공 토스트는 정해진 시간이 지나면 사라진다", () => {
    const store = createToastStore();

    store.show({ type: "success", message: "저장했습니다." });
    vi.advanceTimersByTime(SUCCESS_TOAST_DURATION_MS - 1);
    expect(messagesOf(store)).toEqual(["저장했습니다."]);

    vi.advanceTimersByTime(1);
    expect(messagesOf(store)).toEqual([]);
  });

  it("오류 토스트는 시간이 지나도 남고 닫으면 사라진다", () => {
    const store = createToastStore();

    const id = store.show({ type: "error", message: "실패했습니다." });
    vi.advanceTimersByTime(LONG_TIME_MS);
    expect(messagesOf(store)).toEqual(["실패했습니다."]);

    store.dismiss(id);
    expect(messagesOf(store)).toEqual([]);
  });

  it("닫으면 그 토스트만 지우고 나머지 순서는 그대로 둔다", () => {
    const store = createToastStore();

    store.show({ type: "error", message: "첫째" });
    const id = store.show({ type: "error", message: "둘째" });
    store.show({ type: "error", message: "셋째" });
    store.dismiss(id);

    expect(messagesOf(store)).toEqual(["첫째", "셋째"]);
  });

  it("최대 개수를 넘으면 가장 오래된 토스트를 뺀다", () => {
    const store = createToastStore();
    const messages = Array.from(
      { length: MAX_TOASTS + 1 },
      (_, index) => `문구 ${index}`,
    );

    messages.forEach((message) => store.show({ type: "error", message }));

    expect(messagesOf(store)).toEqual(messages.slice(1));
  });

  it("바뀔 때마다 구독자에게 알리고 구독을 끊으면 알리지 않는다", () => {
    const store = createToastStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    const id = store.show({ type: "error", message: "문구" });
    store.dismiss(id);
    unsubscribe();
    store.show({ type: "error", message: "문구" });

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
