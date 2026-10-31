import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  STAY_CRITERIA_FIELDS,
  stayCriteriaSchema,
  toStayCriteriaSearch,
  toStayCriteriaValues,
  useStayCriteria,
} from "@/entities/stay";
import { SUBMIT_ONLY_VALIDATION, toFieldPropsMap } from "@/shared/lib/form";

export function useStaySearchForm() {
  const criteria = useStayCriteria();
  const values = useMemo(() => toStayCriteriaValues(criteria), [criteria]);
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(stayCriteriaSchema),
    values,
  });
  const fields = toFieldPropsMap(form, STAY_CRITERIA_FIELDS);

  const handleSubmit = form.handleSubmit((nextCriteria) => {
    window.history.pushState(null, "", toStayCriteriaSearch(nextCriteria));
  });

  return { fields, handleSubmit };
}
