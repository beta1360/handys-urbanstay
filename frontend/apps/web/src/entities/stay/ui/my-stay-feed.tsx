"use client";

import type { MyStayPage } from "../api/my-stays";
import { useMyStayFeed } from "../model/use-my-stay-feed";
import { MyStayFeedFooter } from "./my-stay-feed-footer";
import { MyStayListView } from "./my-stay-list-view";

type MyStayFeedProps = {
  initialPages: MyStayPage[];
};

export function MyStayFeed({ initialPages }: MyStayFeedProps) {
  const { sections, more, loadMore, sentinelRef } =
    useMyStayFeed(initialPages);

  return (
    <MyStayListView sections={sections}>
      <MyStayFeedFooter
        more={more}
        onLoadMore={loadMore}
        sentinelRef={sentinelRef}
      />
    </MyStayListView>
  );
}
