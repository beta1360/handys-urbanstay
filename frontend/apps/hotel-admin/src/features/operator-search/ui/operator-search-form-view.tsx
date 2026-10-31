import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { SelectField } from "@repo/ui/select-field";
import { TextField } from "@repo/ui/text-field";
import type { FormFieldProps } from "@repo/admin-kit/form";
import {
  OPERATOR_ACTIVE_LABELS,
  OPERATOR_FIELD_LABELS,
  OPERATOR_KEYWORD_MAX_LENGTH,
} from "@/entities/operator";
import { COMMON_MESSAGES } from "@/shared/config";
import { OPERATOR_SEARCH_FORM_MESSAGES } from "../config/messages";

const ACTIVE_OPTIONS = [
  { value: "", label: OPERATOR_SEARCH_FORM_MESSAGES.allActive },
  { value: String(true), label: OPERATOR_ACTIVE_LABELS.active },
  { value: String(false), label: OPERATOR_ACTIVE_LABELS.inactive },
];

type OperatorSearchFormViewProps = {
  fields: Record<"keyword" | "active", FormFieldProps>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function OperatorSearchFormView({
  fields,
  onSubmit,
}: OperatorSearchFormViewProps) {
  return (
    <form role="search" onSubmit={onSubmit} className="flex items-end gap-2">
      <TextField
        label={OPERATOR_SEARCH_FORM_MESSAGES.keywordLabel}
        type="search"
        maxLength={OPERATOR_KEYWORD_MAX_LENGTH}
        className="w-80"
        {...fields.keyword}
      />
      <SelectField
        label={OPERATOR_FIELD_LABELS.active}
        options={ACTIVE_OPTIONS}
        className="w-36"
        {...fields.active}
      />
      <Button type="submit" variant="secondary">
        {COMMON_MESSAGES.search}
      </Button>
    </form>
  );
}
