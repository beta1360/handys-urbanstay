import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import {
  ADMIN_LIST_DEFAULT_SEARCH,
  ADMIN_LIST_MESSAGES,
  AdminListPage,
  adminListSearchSchema,
} from "@/pages/admin-list";

export const Route = createFileRoute("/_authenticated/admins/")({
  validateSearch: adminListSearchSchema,
  search: {
    middlewares: [stripSearchParams(ADMIN_LIST_DEFAULT_SEARCH)],
  },
  staticData: { title: ADMIN_LIST_MESSAGES.title },
  component: AdminListPage,
});
