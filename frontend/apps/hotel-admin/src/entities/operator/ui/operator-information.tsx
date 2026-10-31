import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import type { Operator } from "@/shared/api";
import { OPERATOR_FIELD_LABELS } from "../config/messages";
import { OperatorActiveLabel } from "./operator-active-label";

type OperatorInformationProps = {
  operator: Operator;
};

export function OperatorInformation({ operator }: OperatorInformationProps) {
  return (
    <Card>
      <DescriptionList>
        <DescriptionListItem term={OPERATOR_FIELD_LABELS.name}>
          {operator.name}
        </DescriptionListItem>
        <DescriptionListItem term={OPERATOR_FIELD_LABELS.loginId}>
          {operator.loginId}
        </DescriptionListItem>
        <DescriptionListItem term={OPERATOR_FIELD_LABELS.active}>
          <OperatorActiveLabel active={operator.active} />
        </DescriptionListItem>
      </DescriptionList>
    </Card>
  );
}
