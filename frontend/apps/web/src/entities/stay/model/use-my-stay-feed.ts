import { useCallback } from "react";
import { MY_STAY_PERIOD } from "@/shared/api";
import type { MyStay, MyStayPeriod } from "@/shared/api";
import { useScrollSentinel } from "@/shared/lib/scroll-sentinel";
import { useMyStayPagesQuery } from "../api/my-stay-pages-query";
import type { MyStayPage } from "../api/my-stays";

export type MyStaySections = {
  upcoming: MyStay[];
  past: MyStay[] | undefined;
};

export type MyStayFeedMore = "idle" | "loading" | "failed" | "end";

export type MyStayFeedState = {
  sections: MyStaySections;
  more: MyStayFeedMore;
  loadMore: () => void;
  sentinelRef: (element: HTMLElement | null) => void;
};

function staysIn(pages: MyStayPage[], period: MyStayPeriod) {
  return pages
    .filter(({ param }) => param.period === period)
    .flatMap(({ items }) => items);
}

function toSections(pages: MyStayPage[]): MyStaySections {
  const pastLoaded = pages.some(
    ({ param }) => param.period === MY_STAY_PERIOD.PAST,
  );
  return {
    upcoming: staysIn(pages, MY_STAY_PERIOD.UPCOMING),
    past: pastLoaded ? staysIn(pages, MY_STAY_PERIOD.PAST) : undefined,
  };
}

type MoreProgress = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
};

function toMore({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
}: MoreProgress): MyStayFeedMore {
  if (isFetchingNextPage) {
    return "loading";
  }
  if (isFetchNextPageError) {
    return "failed";
  }
  return hasNextPage ? "idle" : "end";
}

export function useMyStayFeed(initialPages: MyStayPage[]): MyStayFeedState {
  const query = useMyStayPagesQuery(initialPages);
  const { fetchNextPage } = query;
  const loadMore = useCallback(() => {
    void fetchNextPage({ cancelRefetch: false });
  }, [fetchNextPage]);
  const sentinelRef = useScrollSentinel(loadMore);

  return {
    sections: toSections(query.data.pages),
    more: toMore(query),
    loadMore,
    sentinelRef,
  };
}
