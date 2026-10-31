import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SUBMIT_ONLY_VALIDATION, toFieldPropsMap } from "@repo/admin-kit/form";
import {
  normalizeOperatorActive,
  normalizeOperatorKeyword,
  OPERATOR_LIST_FIRST_PAGE,
} from "@/entities/operator";

const operatorSearchFormSchema = z.object({
  keyword: z.string().transform(normalizeOperatorKeyword),
  active: z.string().transform(normalizeOperatorActive),
});

const OPERATOR_SEARCH_FIELDS = ["keyword", "active"] as const;

export type OperatorSearchCriteria = {
  keyword: string | undefined;
  active: boolean | undefined;
};

export function useOperatorSearchForm({
  keyword,
  active,
}: OperatorSearchCriteria) {
  const navigate = useNavigate();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(operatorSearchFormSchema),
    values: {
      keyword: keyword ?? "",
      active: active === undefined ? "" : String(active),
    },
  });
  const fields = toFieldPropsMap(form, OPERATOR_SEARCH_FIELDS);

  const submit = form.handleSubmit((criteria) => {
    form.setValue("keyword", criteria.keyword ?? "");
    void navigate({
      to: "/operators",
      search: { ...criteria, page: OPERATOR_LIST_FIRST_PAGE },
    });
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    void submit(event);
  }

  return { fields, handleSubmit };
}
