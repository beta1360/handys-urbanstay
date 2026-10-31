import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SUBMIT_ONLY_VALIDATION, toFieldProps } from "@repo/admin-kit/form";
import { GUEST_LIST_FIRST_PAGE, normalizeGuestKeyword } from "@/entities/guest";

const guestSearchFormSchema = z.object({
  keyword: z.string().transform(normalizeGuestKeyword),
});

export function useGuestSearchForm(keyword: string | undefined) {
  const navigate = useNavigate();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(guestSearchFormSchema),
    values: { keyword: keyword ?? "" },
  });
  const keywordField = toFieldProps(form, "keyword");

  const submit = form.handleSubmit(({ keyword: nextKeyword }) => {
    form.setValue("keyword", nextKeyword ?? "");
    void navigate({
      to: "/guests",
      search: { keyword: nextKeyword, page: GUEST_LIST_FIRST_PAGE },
    });
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    void submit(event);
  }

  return { keywordField, handleSubmit };
}
