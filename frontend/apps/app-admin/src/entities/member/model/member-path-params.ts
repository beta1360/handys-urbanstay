import { memberParamsSchema } from "@/shared/api";

const MEMBER_ID_PATTERN = /^\d+$/;

const MEMBER_ID_MIN = 1;

type MemberPathParams = {
  memberId: number | undefined;
};

function toMemberId(value: string) {
  if (!MEMBER_ID_PATTERN.test(value)) {
    return undefined;
  }
  const memberId = Number(value);
  return memberId >= MEMBER_ID_MIN &&
    memberParamsSchema.safeParse({ memberId }).success
    ? memberId
    : undefined;
}

export function parseMemberPathParams(params: {
  memberId: string;
}): MemberPathParams {
  return { memberId: toMemberId(params.memberId) };
}

export function stringifyMemberPathParams({ memberId }: MemberPathParams) {
  return { memberId: String(memberId) };
}
