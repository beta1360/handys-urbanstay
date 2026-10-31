import { useOperatorSearchForm } from "../model/use-operator-search-form";
import type { OperatorSearchCriteria } from "../model/use-operator-search-form";
import { OperatorSearchFormView } from "./operator-search-form-view";

export function OperatorSearchForm({ keyword, active }: OperatorSearchCriteria) {
  const { fields, handleSubmit } = useOperatorSearchForm({ keyword, active });

  return <OperatorSearchFormView fields={fields} onSubmit={handleSubmit} />;
}
