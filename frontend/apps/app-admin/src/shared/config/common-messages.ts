export const COMMON_MESSAGES = {
  loading: "불러오는 중입니다.",
  retry: "다시 시도",
  cancel: "취소",
  register: "등록",
  save: "저장",
  edit: "수정",
  reload: "최신 내용 불러오기",
  backToList: "목록으로",
  search: "검색",
  emptySearchResult: "검색 결과가 없습니다.",
  paginationLabel: "페이지 이동",
  previousPage: "이전",
  nextPage: "다음",
  pageStatus: (page: number, totalPages: number) =>
    `${page} / ${totalPages} 페이지`,
} as const;
