import { createFileRoute } from "@tanstack/react-router";
import {
  parseMemberPathParams,
  stringifyMemberPathParams,
} from "@/entities/member";
import {
  MEMBER_DETAIL_MESSAGES,
  MemberDetailPage,
} from "@/pages/member-detail";

export const Route = createFileRoute("/_authenticated/members/$memberId")({
  params: {
    parse: parseMemberPathParams,
    stringify: stringifyMemberPathParams,
  },
  staticData: { title: MEMBER_DETAIL_MESSAGES.title },
  component: MemberDetailPage,
});
