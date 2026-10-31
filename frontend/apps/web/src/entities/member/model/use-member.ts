import type { Member } from "@/shared/api";
import { useHydrated } from "@/shared/lib/hydration";
import { useMemberQuery } from "../api/member-query";

export type MemberState =
  | { status: "checking" }
  | { status: "guest" }
  | { status: "member"; member: Member };

export function useMember(): MemberState {
  const hydrated = useHydrated();
  const { data, error } = useMemberQuery();

  if (!hydrated) {
    return { status: "checking" };
  }
  if (data === undefined) {
    return error === null ? { status: "checking" } : { status: "guest" };
  }
  return data === null
    ? { status: "guest" }
    : { status: "member", member: data };
}
