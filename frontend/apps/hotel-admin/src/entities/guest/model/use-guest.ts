import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Guest } from "@/shared/api";
import { useGuestQuery } from "../api/guest-query";

export type GuestState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "notFound" }
  | { status: "ready"; guest: Guest };

export function useGuest(guestId: number): GuestState {
  const { data, error, refetch } = useGuestQuery(guestId);

  if (data !== undefined) {
    return { status: "ready", guest: data };
  }
  if (error === null) {
    return { status: "loading" };
  }
  if (getApiError(error)?.code === API_ERROR_CODES.guestNotFound) {
    return { status: "notFound" };
  }
  return { status: "failed", retry: () => void refetch() };
}
