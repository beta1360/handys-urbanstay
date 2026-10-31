export const COMMON_MESSAGES = {
  loading: "불러오는 중입니다.",
  retry: "다시 시도",
  cancel: "취소",
  backToList: "목록으로",
  search: "검색",
  all: "전체",
  emptySearchResult: "검색 결과가 없습니다.",
  paginationLabel: "페이지 이동",
  previousPage: "이전",
  nextPage: "다음",
  pageStatus: (page: number, totalPages: number) =>
    `${page} / ${totalPages} 페이지`,
  register: "등록",
  create: "생성",
  save: "저장",
  edit: "수정",
  reload: "최신 내용 불러오기",
} as const;
