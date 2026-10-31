import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import type { Stay } from "@/shared/api";
import { formatKoreanDateTime } from "@/shared/lib/date-time";
import { STAY_CANCELLATION_LABELS } from "../config/messages";

type StayCancellationInformationProps = {
  cancellation: NonNullable<Stay["cancellation"]>;
};

export function StayCancellationInformation({
  cancellation,
}: StayCancellationInformationProps) {
  return (
    <Card
      header={
        <h2 className="text-base font-semibold text-neutral-900">
          {STAY_CANCELLATION_LABELS.title}
        </h2>
      }
    >
      <DescriptionList>
        <DescriptionListItem term={STAY_CANCELLATION_LABELS.canceledAt}>
          {formatKoreanDateTime(cancellation.canceledAt)}
        </DescriptionListItem>
        <DescriptionListItem term={STAY_CANCELLATION_LABELS.canceledBy}>
          {cancellation.canceledBy.name}
        </DescriptionListItem>
        <DescriptionListItem term={STAY_CANCELLATION_LABELS.reason}>
          {cancellation.reason ?? (
            <span className="text-neutral-500">
              {STAY_CANCELLATION_LABELS.emptyReason}
            </span>
          )}
        </DescriptionListItem>
      </DescriptionList>
    </Card>
  );
}
