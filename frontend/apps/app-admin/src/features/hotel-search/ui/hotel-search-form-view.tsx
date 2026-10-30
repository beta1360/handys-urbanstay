import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { TextField } from "@repo/ui/text-field";
import { HOTEL_KEYWORD_MAX_LENGTH } from "@/entities/hotel";
import type { FormFieldProps } from "@/shared/lib/form";
import { HOTEL_SEARCH_FORM_MESSAGES } from "../config/messages";

type HotelSearchFormViewProps = {
  keywordField: FormFieldProps;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function HotelSearchFormView({
  keywordField,
  onSubmit,
}: HotelSearchFormViewProps) {
  return (
    <form role="search" onSubmit={onSubmit} className="flex items-end gap-2">
      <TextField
        label={HOTEL_SEARCH_FORM_MESSAGES.keywordLabel}
        type="search"
        maxLength={HOTEL_KEYWORD_MAX_LENGTH}
        className="w-80"
        {...keywordField}
      />
      <Button type="submit" variant="secondary">
        {HOTEL_SEARCH_FORM_MESSAGES.search}
      </Button>
    </form>
  );
}
