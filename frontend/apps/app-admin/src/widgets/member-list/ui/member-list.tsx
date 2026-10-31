import { MemberLoading } from "@/entities/member";
import { useMemberList } from "../model/use-member-list";
import type { MemberListCriteria } from "../model/use-member-list";
import { MemberListEmpty } from "./member-list-empty";
import { MemberListLoadFailed } from "./member-list-load-failed";
import { MemberListPagination } from "./member-list-pagination";
import { MemberTable } from "./member-table";

export function MemberList({ keyword, page }: MemberListCriteria) {
  const state = useMemberList({ keyword, page });

  switch (state.status) {
    case "loading":
      return <MemberLoading />;
    case "failed":
      return <MemberListLoadFailed onRetry={state.retry} />;
    case "empty":
      return <MemberListEmpty hasKeyword={state.hasKeyword} />;
    case "ready":
      return (
        <>
          <MemberTable members={state.members} isUpdating={state.isUpdating} />
          <MemberListPagination {...state.pagination} />
        </>
      );
  }
}
