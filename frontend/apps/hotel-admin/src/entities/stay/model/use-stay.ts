import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Stay } from "@/shared/api";
import { useStayQuery } from "../api/stay-query";

export type StayState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "notFound" }
  | { status: "ready"; stay: Stay };

export function useStay(stayId: number): StayState {
  const { data, error, refetch } = useStayQuery(stayId);

  if (data !== undefined) {
    return { status: "ready", stay: data };
  }
  if (error === null) {
    return { status: "loading" };
  }
  if (getApiError(error)?.code === API_ERROR_CODES.stayNotFound) {
    return { status: "notFound" };
  }
  return { status: "failed", retry: () => void refetch() };
}
