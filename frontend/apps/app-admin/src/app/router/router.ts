import { createRouter } from "@tanstack/react-router";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { handleUnauthorizedError } from "../auth/unauthorized-handler";
import { createQueryClient } from "../query/query-client";
import { routeTree } from "./route-tree.gen";

export const queryClient = createQueryClient((error, queryKey) =>
  handleUnauthorizedError(error, queryKey, { queryClient, router }),
);

export const router = createRouter({
  routeTree,
  context: { queryClient },
  parseSearch,
  stringifySearch,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }

  interface StaticDataRouteOption {
    title?: string;
  }
}
