export const HOTEL_LIST_MESSAGES = {
  title: "호텔",
  keywordLabel: "호텔 이름",
  search: "검색",
  nameColumn: "이름",
  addressColumn: "주소",
  phoneColumn: "대표 전화번호",
  loading: "불러오는 중입니다.",
  empty: "등록된 호텔이 없습니다.",
  emptySearchResult: "검색 결과가 없습니다.",
  loadFailed: "호텔 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  retry: "다시 시도",
  paginationLabel: "페이지 이동",
  previousPage: "이전",
  nextPage: "다음",
  pageStatus: (page: number, totalPages: number) =>
    `${page} / ${totalPages} 페이지`,
} as const;
