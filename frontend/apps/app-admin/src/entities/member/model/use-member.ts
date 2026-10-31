import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Member } from "@/shared/api";
import { useMemberQuery } from "../api/member-query";

export type MemberState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "notFound" }
  | { status: "ready"; member: Member };

export function useMember(memberId: number): MemberState {
  const { data, error, refetch } = useMemberQuery(memberId);

  if (data !== undefined) {
    return { status: "ready", member: data };
  }
  if (error === null) {
    return { status: "loading" };
  }
  if (getApiError(error)?.code === API_ERROR_CODES.memberNotFound) {
    return { status: "notFound" };
  }
  return { status: "failed", retry: () => void refetch() };
}
