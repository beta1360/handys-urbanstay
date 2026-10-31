import { createFileRoute } from "@tanstack/react-router";
import {
  OPERATOR_DETAIL_MESSAGES,
  OperatorDetailPage,
} from "@/pages/operator-detail";

export const Route = createFileRoute("/_authenticated/operators/$operatorId/")({
  staticData: { title: OPERATOR_DETAIL_MESSAGES.title },
  component: OperatorDetailPage,
});
