import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import type { Member } from "@/shared/api";
import { formatKoreanDate } from "@/shared/lib/date-time";
import { MEMBER_FIELD_LABELS } from "../config/messages";

type MemberInformationProps = {
  member: Member;
};

export function MemberInformation({ member }: MemberInformationProps) {
  return (
    <Card>
      <DescriptionList>
        <DescriptionListItem term={MEMBER_FIELD_LABELS.name}>
          {member.name}
        </DescriptionListItem>
        <DescriptionListItem term={MEMBER_FIELD_LABELS.email}>
          {member.email}
        </DescriptionListItem>
        <DescriptionListItem term={MEMBER_FIELD_LABELS.phone}>
          {member.phone}
        </DescriptionListItem>
        <DescriptionListItem term={MEMBER_FIELD_LABELS.createdAt}>
          <time dateTime={member.createdAt}>
            {formatKoreanDate(member.createdAt)}
          </time>
        </DescriptionListItem>
      </DescriptionList>
    </Card>
  );
}
