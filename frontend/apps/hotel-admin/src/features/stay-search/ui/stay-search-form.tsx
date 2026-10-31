import { useStaySearchForm } from "../model/use-stay-search-form";
import type { StaySearchCriteria } from "../model/use-stay-search-form";
import { StaySearchFormView } from "./stay-search-form-view";

export function StaySearchForm(criteria: StaySearchCriteria) {
  const { fields, roomOptions, roomHint, handleSubmit } =
    useStaySearchForm(criteria);

  return (
    <StaySearchFormView
      fields={fields}
      roomOptions={roomOptions}
      roomHint={roomHint}
      onSubmit={handleSubmit}
    />
  );
}
