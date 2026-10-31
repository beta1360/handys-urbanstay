import { usePathname, useSearchParams } from "next/navigation";

export function useCurrentHref() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  return search === "" ? pathname : `${pathname}?${search}`;
}
