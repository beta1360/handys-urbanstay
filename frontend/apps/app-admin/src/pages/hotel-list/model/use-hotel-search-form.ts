import { useState } from "react";
import type { FormEvent } from "react";
import { normalizeHotelKeyword } from "./hotel-list-search";

export function useHotelSearchForm(
  keyword: string | undefined,
  onSearch: (keyword: string | undefined) => void,
) {
  const [input, setInput] = useState(keyword ?? "");
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);

  // 뒤로 가기 등으로 URL 검색어가 바뀌면 검색창 값을 맞춘다.
  // 리마운트하면 Enter 검색 뒤 포커스를 잃어 렌더 중에 맞춘다.
  if (syncedKeyword !== keyword) {
    setSyncedKeyword(keyword);
    setInput(keyword ?? "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextKeyword = normalizeHotelKeyword(input);
    setInput(nextKeyword ?? "");
    onSearch(nextKeyword);
  }

  return { input, changeInput: setInput, handleSubmit };
}
