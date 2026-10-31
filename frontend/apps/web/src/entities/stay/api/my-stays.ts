import {
  fetchMyStays,
  MY_STAY_LIST_MAX_PAGE,
  MY_STAY_PERIOD,
} from "@/shared/api";
import type { MyStay, MyStayPeriod } from "@/shared/api";

const MY_STAY_PAGE_SIZE = 10;

export type MyStayPageParam = {
  period: MyStayPeriod;
  page: number;
};

export type MyStayPage = {
  param: MyStayPageParam;
  items: MyStay[];
  next: MyStayPageParam | undefined;
};

type MyStayPageOptions = {
  cookie?: string;
  signal?: AbortSignal;
};

export const MY_STAY_FIRST_PAGE: Record<"upcoming" | "past", MyStayPageParam> =
  {
    upcoming: { period: MY_STAY_PERIOD.UPCOMING, page: 0 },
    past: { period: MY_STAY_PERIOD.PAST, page: 0 },
  };

function nextPageParam(param: MyStayPageParam, totalPages: number) {
  const nextPage = param.page + 1;
  if (nextPage < totalPages && nextPage <= MY_STAY_LIST_MAX_PAGE) {
    return { period: param.period, page: nextPage };
  }
  return param.period === MY_STAY_PERIOD.UPCOMING
    ? MY_STAY_FIRST_PAGE.past
    : undefined;
}

export async function getMyStayPage(
  param: MyStayPageParam,
  { cookie, signal }: MyStayPageOptions = {},
): Promise<MyStayPage> {
  const { items, totalPages } = await fetchMyStays(
    { ...param, size: MY_STAY_PAGE_SIZE },
    { cookie, signal },
  );
  return { param, items, next: nextPageParam(param, totalPages) };
}
