import { useInfiniteQuery } from "@tanstack/react-query";
import { myStaysQueryKey } from "@/shared/api";
import { getMyStayPage, MY_STAY_FIRST_PAGE } from "./my-stays";
import type { MyStayPage } from "./my-stays";

const MY_STAY_PAGES_GC_TIME_MS = 0;

export function useMyStayPagesQuery(initialPages: MyStayPage[]) {
  return useInfiniteQuery({
    queryKey: myStaysQueryKey(),
    queryFn: ({ pageParam, signal }) => getMyStayPage(pageParam, { signal }),
    initialPageParam: MY_STAY_FIRST_PAGE.upcoming,
    getNextPageParam: (lastPage) => lastPage.next,
    initialData: {
      pages: initialPages,
      pageParams: initialPages.map(({ param }) => param),
    },
    refetchOnMount: false,
    gcTime: MY_STAY_PAGES_GC_TIME_MS,
  });
}
