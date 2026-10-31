import {
  MemberInformation,
  MemberLoadFailed,
  MemberLoading,
  MemberNotFound,
  useMember,
} from "@/entities/member";
import { MemberDetailActions } from "./member-detail-actions";
import { MemberStayHistory } from "./member-stay-history";

type MemberDetailProps = {
  memberId: number;
};

export function MemberDetail({ memberId }: MemberDetailProps) {
  const state = useMember(memberId);

  switch (state.status) {
    case "notFound":
      return <MemberNotFound />;
    case "loading":
      return (
        <>
          <MemberDetailActions />
          <MemberLoading />
        </>
      );
    case "failed":
      return (
        <>
          <MemberDetailActions />
          <MemberLoadFailed onRetry={state.retry} />
        </>
      );
    case "ready":
      return (
        <>
          <MemberDetailActions />
          <MemberInformation member={state.member} />
          <MemberStayHistory
            key={state.member.id}
            memberId={state.member.id}
          />
        </>
      );
  }
}
