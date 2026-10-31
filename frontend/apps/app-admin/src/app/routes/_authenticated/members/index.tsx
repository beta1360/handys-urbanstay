import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import {
  MEMBER_LIST_DEFAULT_SEARCH,
  MEMBER_LIST_MESSAGES,
  MemberListPage,
  memberListSearchSchema,
} from "@/pages/member-list";

export const Route = createFileRoute("/_authenticated/members/")({
  validateSearch: memberListSearchSchema,
  search: {
    middlewares: [stripSearchParams(MEMBER_LIST_DEFAULT_SEARCH)],
  },
  staticData: { title: MEMBER_LIST_MESSAGES.title },
  component: MemberListPage,
});
