import { getRouteApi } from "@tanstack/react-router";
import { MemberSearchForm } from "@/features/member-search";
import { MemberList } from "@/widgets/member-list";

const memberListRoute = getRouteApi("/_authenticated/members/");

export function MemberListPage() {
  const { keyword, page } = memberListRoute.useSearch();

  return (
    <div className="flex flex-col gap-4">
      <MemberSearchForm keyword={keyword} />
      <MemberList keyword={keyword} page={page} />
    </div>
  );
}
