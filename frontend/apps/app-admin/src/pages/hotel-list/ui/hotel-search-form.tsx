import { Button } from "@repo/ui/button";
import { TextField } from "@repo/ui/text-field";
import { HOTEL_LIST_MESSAGES } from "../config/messages";
import { HOTEL_KEYWORD_MAX_LENGTH } from "../model/hotel-list-search";
import { useHotelSearchForm } from "../model/use-hotel-search-form";

type HotelSearchFormProps = {
  keyword: string | undefined;
  onSearch: (keyword: string | undefined) => void;
};

export function HotelSearchForm({ keyword, onSearch }: HotelSearchFormProps) {
  const { input, changeInput, handleSubmit } = useHotelSearchForm(
    keyword,
    onSearch,
  );

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex items-end gap-2"
    >
      <TextField
        label={HOTEL_LIST_MESSAGES.keywordLabel}
        type="search"
        name="keyword"
        value={input}
        maxLength={HOTEL_KEYWORD_MAX_LENGTH}
        onChange={(event) => changeInput(event.target.value)}
        className="w-80"
      />
      <Button type="submit" variant="secondary">
        {HOTEL_LIST_MESSAGES.search}
      </Button>
    </form>
  );
}
