import { useOperatorPasswordResetForm } from "../model/use-operator-password-reset-form";
import { OperatorPasswordResetView } from "./operator-password-reset-view";

type OperatorPasswordResetProps = {
  operatorId: number;
};

export function OperatorPasswordReset({
  operatorId,
}: OperatorPasswordResetProps) {
  const { fields, status, handleSubmit } =
    useOperatorPasswordResetForm(operatorId);

  return (
    <OperatorPasswordResetView
      fields={fields}
      status={status}
      onSubmit={handleSubmit}
    />
  );
}
