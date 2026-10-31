import { COMMON_MESSAGES } from "@/shared/config";
import { Button, LoadingMessage } from "@/shared/ui";
import { MY_STAY_MESSAGES } from "../config/messages";
import type { MyStayFeedMore } from "../model/use-my-stay-feed";

type MyStayFeedFooterProps = {
  more: MyStayFeedMore;
  onLoadMore: () => void;
  sentinelRef: (element: HTMLElement | null) => void;
};

export function MyStayFeedFooter({
  more,
  onLoadMore,
  sentinelRef,
}: MyStayFeedFooterProps) {
  if (more === "end") {
    return (
      <p className="py-4 text-center text-sm text-gray-500">
        {MY_STAY_MESSAGES.end}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {more === "idle" ? (
        <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      ) : null}
      {more === "loading" ? <LoadingMessage /> : null}
      {more === "failed" ? (
        <p role="alert" className="text-sm text-gray-700">
          {MY_STAY_MESSAGES.loadMoreFailed}
        </p>
      ) : null}
      <Button variant="secondary" onClick={onLoadMore}>
        {more === "failed" ? COMMON_MESSAGES.retry : MY_STAY_MESSAGES.loadMore}
      </Button>
    </div>
  );
}
