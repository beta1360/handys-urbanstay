import { useMemberSearchForm } from "../model/use-member-search-form";
import { MemberSearchFormView } from "./member-search-form-view";

type MemberSearchFormProps = {
  keyword: string | undefined;
};

export function MemberSearchForm({ keyword }: MemberSearchFormProps) {
  const { keywordField, handleSubmit } = useMemberSearchForm(keyword);

  return (
    <MemberSearchFormView keywordField={keywordField} onSubmit={handleSubmit} />
  );
}
