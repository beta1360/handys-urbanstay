import { createFileRoute } from "@tanstack/react-router";
import { OPERATOR_EDIT_MESSAGES, OperatorEditPage } from "@/pages/operator-edit";

export const Route = createFileRoute("/_authenticated/operators/$operatorId/edit")({
  staticData: { title: OPERATOR_EDIT_MESSAGES.title },
  component: OperatorEditPage,
});
