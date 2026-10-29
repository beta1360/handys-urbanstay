import { useMatches } from "@tanstack/react-router";

export function useCurrentTitle() {
  return useMatches({
    select: (matches) =>
      matches
        .map((match) => match.staticData.title)
        .filter((title) => title !== undefined)
        .at(-1),
  });
}
