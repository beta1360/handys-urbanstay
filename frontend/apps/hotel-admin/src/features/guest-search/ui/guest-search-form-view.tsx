import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { TextField } from "@repo/ui/text-field";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { GUEST_KEYWORD_MAX_LENGTH } from "@/entities/guest";
import { GUEST_SEARCH_FORM_MESSAGES } from "../config/messages";

type GuestSearchFormViewProps = {
  keywordField: FormFieldProps;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function GuestSearchFormView({
  keywordField,
  onSubmit,
}: GuestSearchFormViewProps) {
  return (
    <form role="search" onSubmit={onSubmit} className="flex items-end gap-2">
      <TextField
        label={GUEST_SEARCH_FORM_MESSAGES.keywordLabel}
        type="search"
        maxLength={GUEST_KEYWORD_MAX_LENGTH}
        className="w-80"
        {...keywordField}
      />
      <Button type="submit" variant="secondary">
        {GUEST_SEARCH_FORM_MESSAGES.search}
      </Button>
    </form>
  );
}
