import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import {
  STAY_LIST_DEFAULT_SEARCH,
  STAY_LIST_MESSAGES,
  StayListPage,
  stayListSearchSchema,
} from "@/pages/stay-list";

export const Route = createFileRoute("/_authenticated/stays/")({
  validateSearch: stayListSearchSchema,
  search: {
    middlewares: [stripSearchParams(STAY_LIST_DEFAULT_SEARCH)],
  },
  staticData: { title: STAY_LIST_MESSAGES.title },
  component: StayListPage,
});
