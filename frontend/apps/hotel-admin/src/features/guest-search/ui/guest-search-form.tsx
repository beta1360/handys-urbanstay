import { useGuestSearchForm } from "../model/use-guest-search-form";
import { GuestSearchFormView } from "./guest-search-form-view";

type GuestSearchFormProps = {
  keyword: string | undefined;
};

export function GuestSearchForm({ keyword }: GuestSearchFormProps) {
  const { keywordField, handleSubmit } = useGuestSearchForm(keyword);

  return (
    <GuestSearchFormView keywordField={keywordField} onSubmit={handleSubmit} />
  );
}
