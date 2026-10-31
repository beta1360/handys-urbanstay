import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { parseStayCriteria } from "./stay-criteria";

export function useStayCriteria() {
  const search = useSearchParams().toString();

  return useMemo(() => parseStayCriteria(new URLSearchParams(search)), [search]);
}
