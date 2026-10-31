import { COMMON_MESSAGES } from "@/shared/config";

export function HotelMasterLoading() {
  return (
    <p role="status" className="text-center text-sm text-neutral-500">
      {COMMON_MESSAGES.loading}
    </p>
  );
}
