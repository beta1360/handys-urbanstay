import { createFileRoute } from "@tanstack/react-router";
import {
  OPERATOR_CREATE_MESSAGES,
  OperatorCreatePage,
} from "@/pages/operator-create";

export const Route = createFileRoute("/_authenticated/operators/new")({
  staticData: { title: OPERATOR_CREATE_MESSAGES.title },
  component: OperatorCreatePage,
});
