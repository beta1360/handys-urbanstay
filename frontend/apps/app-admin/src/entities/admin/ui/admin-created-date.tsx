import { formatKoreanDate } from "@/shared/lib/date-time";

type AdminCreatedDateProps = {
  createdAt: string;
};

export function AdminCreatedDate({ createdAt }: AdminCreatedDateProps) {
  return <time dateTime={createdAt}>{formatKoreanDate(createdAt)}</time>;
}
