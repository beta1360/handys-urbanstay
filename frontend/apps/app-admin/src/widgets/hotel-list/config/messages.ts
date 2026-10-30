export const HOTEL_LIST_CONTENT_MESSAGES = {
  empty: "등록된 호텔이 없습니다.",
  emptySearchResult: "검색 결과가 없습니다.",
  loadFailed: "호텔 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  paginationLabel: "페이지 이동",
  previousPage: "이전",
  nextPage: "다음",
  pageStatus: (page: number, totalPages: number) =>
    `${page} / ${totalPages} 페이지`,
} as const;
