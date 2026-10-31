import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { TextField } from "@repo/ui/text-field";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { MEMBER_KEYWORD_MAX_LENGTH } from "@/entities/member";
import { COMMON_MESSAGES } from "@/shared/config";
import { MEMBER_SEARCH_FORM_MESSAGES } from "../config/messages";

type MemberSearchFormViewProps = {
  keywordField: FormFieldProps;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function MemberSearchFormView({
  keywordField,
  onSubmit,
}: MemberSearchFormViewProps) {
  return (
    <form role="search" onSubmit={onSubmit} className="flex items-end gap-2">
      <TextField
        label={MEMBER_SEARCH_FORM_MESSAGES.keywordLabel}
        type="search"
        maxLength={MEMBER_KEYWORD_MAX_LENGTH}
        className="w-80"
        {...keywordField}
      />
      <Button type="submit" variant="secondary">
        {COMMON_MESSAGES.search}
      </Button>
    </form>
  );
}
