import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import {
  SETTLEMENT_DEFAULT_SEARCH,
  SETTLEMENT_MESSAGES,
  SettlementPage,
  settlementSearchSchema,
} from "@/pages/settlement";

export const Route = createFileRoute("/_authenticated/settlements/")({
  validateSearch: settlementSearchSchema,
  search: {
    middlewares: [stripSearchParams(SETTLEMENT_DEFAULT_SEARCH)],
  },
  staticData: { title: SETTLEMENT_MESSAGES.title },
  component: SettlementPage,
});
