"use client";

import { useStaySearchForm } from "../model/use-stay-search-form";
import { StaySearchFormView } from "./stay-search-form-view";

export function StaySearch() {
  const { fields, handleSubmit } = useStaySearchForm();

  return <StaySearchFormView fields={fields} onSubmit={handleSubmit} />;
}
