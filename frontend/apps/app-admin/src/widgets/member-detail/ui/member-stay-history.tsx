import { useId } from "react";
import { MemberLoading } from "@/entities/member";
import { MEMBER_STAY_HISTORY_MESSAGES } from "../config/messages";
import { useMemberStayHistory } from "../model/use-member-stay-history";
import type { MemberStayHistoryState } from "../model/use-member-stay-history";
import { MemberStayHistoryEmpty } from "./member-stay-history-empty";
import { MemberStayHistoryLoadFailed } from "./member-stay-history-load-failed";
import { MemberStayHistoryPagination } from "./member-stay-history-pagination";
import { MemberStayHistoryTable } from "./member-stay-history-table";

type MemberStayHistoryContentProps = {
  state: MemberStayHistoryState;
};

function MemberStayHistoryContent({ state }: MemberStayHistoryContentProps) {
  switch (state.status) {
    case "loading":
      return <MemberLoading />;
    case "failed":
      return <MemberStayHistoryLoadFailed onRetry={state.retry} />;
    case "empty":
      return <MemberStayHistoryEmpty />;
    case "ready":
      return (
        <>
          <MemberStayHistoryTable
            stays={state.stays}
            isUpdating={state.isUpdating}
          />
          <MemberStayHistoryPagination {...state.pagination} />
        </>
      );
  }
}

type MemberStayHistoryProps = {
  memberId: number;
};

export function MemberStayHistory({ memberId }: MemberStayHistoryProps) {
  const headingId = useId();
  const state = useMemberStayHistory(memberId);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2
        id={headingId}
        className="text-base font-semibold text-neutral-900"
      >
        {MEMBER_STAY_HISTORY_MESSAGES.title}
      </h2>
      <MemberStayHistoryContent state={state} />
    </section>
  );
}
