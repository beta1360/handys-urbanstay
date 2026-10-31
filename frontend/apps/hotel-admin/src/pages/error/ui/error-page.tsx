import { useRouter } from "@tanstack/react-router";
import { Button } from "@repo/ui/button";
import { COMMON_MESSAGES } from "@/shared/config";
import { ERROR_PAGE_MESSAGES } from "../config/messages";

export function ErrorPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-50 px-4 text-center">
      <p className="text-sm text-neutral-700">
        {ERROR_PAGE_MESSAGES.description}
      </p>
      <Button variant="secondary" onClick={() => router.invalidate()}>
        {COMMON_MESSAGES.retry}
      </Button>
    </main>
  );
}
