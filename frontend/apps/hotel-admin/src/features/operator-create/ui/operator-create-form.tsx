import { useOperatorCreateForm } from "../model/use-operator-create-form";
import { OperatorCreateFormView } from "./operator-create-form-view";

export function OperatorCreateForm() {
  const { fields, isSubmitting, handleSubmit } = useOperatorCreateForm();

  return (
    <OperatorCreateFormView
      fields={fields}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
