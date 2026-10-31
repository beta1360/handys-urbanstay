import { getRouteApi } from "@tanstack/react-router";
import { ButtonLink } from "@repo/admin-kit/link";
import { OperatorSearchForm } from "@/features/operator-search";
import { OperatorList } from "@/widgets/operator-list";
import { OPERATOR_LIST_MESSAGES } from "../config/messages";

const operatorListRoute = getRouteApi("/_authenticated/operators/");

export function OperatorListPage() {
  const { keyword, active, page } = operatorListRoute.useSearch();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <OperatorSearchForm keyword={keyword} active={active} />
        <ButtonLink to="/operators/new" variant="primary">
          {OPERATOR_LIST_MESSAGES.create}
        </ButtonLink>
      </div>
      <OperatorList keyword={keyword} active={active} page={page} />
    </div>
  );
}
