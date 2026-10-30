import { useHotelSearchForm } from "../model/use-hotel-search-form";
import { HotelSearchFormView } from "./hotel-search-form-view";

type HotelSearchFormProps = {
  keyword: string | undefined;
};

export function HotelSearchForm({ keyword }: HotelSearchFormProps) {
  const { keywordField, handleSubmit } = useHotelSearchForm(keyword);

  return (
    <HotelSearchFormView keywordField={keywordField} onSubmit={handleSubmit} />
  );
}
