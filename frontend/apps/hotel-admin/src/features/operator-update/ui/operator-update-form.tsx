import { OperatorNotFound } from "@/entities/operator";
import type { Operator } from "@/shared/api";
import { useOperatorUpdateForm } from "../model/use-operator-update-form";
import { OperatorUpdateFormView } from "./operator-update-form-view";

type OperatorUpdateFormProps = {
  operatorId: number;
  initialOperator: Operator;
};

export function OperatorUpdateForm({
  operatorId,
  initialOperator,
}: OperatorUpdateFormProps) {
  const { fields, alert, status, reloadButtonRef, handleSubmit, reload } =
    useOperatorUpdateForm(operatorId, initialOperator);

  if (status === "notFound") {
    return <OperatorNotFound />;
  }
  return (
    <OperatorUpdateFormView
      operatorId={operatorId}
      fields={fields}
      alert={alert}
      status={status}
      reloadButtonRef={reloadButtonRef}
      onSubmit={handleSubmit}
      onReload={reload}
    />
  );
}
