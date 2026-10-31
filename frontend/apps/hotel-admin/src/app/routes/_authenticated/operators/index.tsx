import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import {
  OPERATOR_LIST_DEFAULT_SEARCH,
  OPERATOR_LIST_MESSAGES,
  OperatorListPage,
  operatorListSearchSchema,
} from "@/pages/operator-list";

export const Route = createFileRoute("/_authenticated/operators/")({
  validateSearch: operatorListSearchSchema,
  search: {
    middlewares: [stripSearchParams(OPERATOR_LIST_DEFAULT_SEARCH)],
  },
  staticData: { title: OPERATOR_LIST_MESSAGES.title },
  component: OperatorListPage,
});
