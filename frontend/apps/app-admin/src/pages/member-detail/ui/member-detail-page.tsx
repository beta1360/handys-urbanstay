import { getRouteApi } from "@tanstack/react-router";
import { MemberNotFound } from "@/entities/member";
import { MemberDetail } from "@/widgets/member-detail";

const memberDetailRoute = getRouteApi("/_authenticated/members/$memberId");

export function MemberDetailPage() {
  const { memberId } = memberDetailRoute.useParams();

  return (
    <div className="flex flex-col gap-4">
      {memberId === undefined ? (
        <MemberNotFound />
      ) : (
        <MemberDetail memberId={memberId} />
      )}
    </div>
  );
}
