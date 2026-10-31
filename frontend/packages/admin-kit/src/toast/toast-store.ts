import { useSyncExternalStore } from "react";
import type { ToastType } from "@repo/ui/toast";

export const SUCCESS_TOAST_DURATION_MS = 4000;

export const MAX_TOASTS = 3;

export type ToastId = number;

export type ToastItem = {
  id: ToastId;
  type: ToastType;
  message: string;
};

export function createToastStore() {
  let toasts: readonly ToastItem[] = [];
  let nextId = 1;
  const timers = new Map<ToastId, ReturnType<typeof setTimeout>>();
  const listeners = new Set<() => void>();

  function setToasts(next: readonly ToastItem[]) {
    toasts = next;
    listeners.forEach((listener) => listener());
  }

  function clearTimer(id: ToastId) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  }

  function dismiss(id: ToastId) {
    clearTimer(id);
    if (toasts.some((toast) => toast.id === id)) {
      setToasts(toasts.filter((toast) => toast.id !== id));
    }
  }

  function show({ type, message }: Omit<ToastItem, "id">) {
    const id = nextId++;
    const next = [...toasts, { id, type, message }];
    next.slice(0, -MAX_TOASTS).forEach((toast) => clearTimer(toast.id));
    setToasts(next.slice(-MAX_TOASTS));
    if (type === "success") {
      timers.set(
        id,
        setTimeout(() => dismiss(id), SUCCESS_TOAST_DURATION_MS),
      );
    }
    return id;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function getSnapshot() {
    return toasts;
  }

  return { show, dismiss, subscribe, getSnapshot };
}

const toastStore = createToastStore();

export const showToast = toastStore.show;

export const dismissToast = toastStore.dismiss;

export function useToasts() {
  return useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot);
}
