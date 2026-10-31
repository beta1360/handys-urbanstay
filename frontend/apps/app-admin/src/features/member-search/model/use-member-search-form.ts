import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SUBMIT_ONLY_VALIDATION, toFieldProps } from "@repo/admin-kit/form";
import {
  MEMBER_LIST_FIRST_PAGE,
  normalizeMemberKeyword,
} from "@/entities/member";

const memberSearchFormSchema = z.object({
  keyword: z.string().transform(normalizeMemberKeyword),
});

export function useMemberSearchForm(keyword: string | undefined) {
  const navigate = useNavigate();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(memberSearchFormSchema),
    values: { keyword: keyword ?? "" },
  });
  const keywordField = toFieldProps(form, "keyword");

  const submit = form.handleSubmit(({ keyword: nextKeyword }) => {
    form.setValue("keyword", nextKeyword ?? "");
    void navigate({
      to: "/members",
      search: { keyword: nextKeyword, page: MEMBER_LIST_FIRST_PAGE },
    });
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    void submit(event);
  }

  return { keywordField, handleSubmit };
}
