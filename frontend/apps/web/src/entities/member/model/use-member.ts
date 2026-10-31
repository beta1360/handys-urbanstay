import type { Member } from "@/shared/api";
import { useMemberQuery } from "../api/member-query";

export type MemberState =
  | { status: "checking" }
  | { status: "guest" }
  | { status: "member"; member: Member };

export function useMember(): MemberState {
  const { data, error } = useMemberQuery();

  if (data === undefined) {
    return error === null ? { status: "checking" } : { status: "guest" };
  }
  return data === null
    ? { status: "guest" }
    : { status: "member", member: data };
}
