"use client";

import { COMMON_MESSAGES } from "@/shared/config";
import { Button } from "@/shared/ui";

type ErrorPageProps = {
  retry: () => void;
};

export function ErrorPage({ retry }: ErrorPageProps) {
  return (
    <section className="flex flex-col gap-4 px-4 py-10 text-center">
      <p role="alert" className="text-sm text-gray-700">
        {COMMON_MESSAGES.requestFailed}
      </p>
      <Button variant="secondary" onClick={retry}>
        {COMMON_MESSAGES.retry}
      </Button>
    </section>
  );
}
