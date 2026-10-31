import { useSyncExternalStore } from "react";

export const TOAST_DURATION_MS = 3000;

export type ToastItem = {
  id: number;
  message: string;
};

export function createToastStore() {
  let toast: ToastItem | null = null;
  let nextId = 1;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();

  function setToast(next: ToastItem | null) {
    toast = next;
    listeners.forEach((listener) => listener());
  }

  function show(message: string) {
    clearTimeout(timer);
    setToast({ id: nextId++, message });
    timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function getSnapshot() {
    return toast;
  }

  return { show, subscribe, getSnapshot };
}

const toastStore = createToastStore();

export const showToast = toastStore.show;

function getServerSnapshot() {
  return null;
}

export function useToast() {
  return useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    getServerSnapshot,
  );
}
