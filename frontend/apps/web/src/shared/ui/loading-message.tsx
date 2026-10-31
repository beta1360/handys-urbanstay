import { COMMON_MESSAGES } from "@/shared/config";

export function LoadingMessage() {
  return (
    <p role="status" className="py-8 text-center text-sm text-gray-500">
      {COMMON_MESSAGES.loading}
    </p>
  );
}
