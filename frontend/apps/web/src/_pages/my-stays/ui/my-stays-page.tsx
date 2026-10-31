import { Suspense } from "react";
import { MyStays } from "@/widgets/my-stays";
import { COMMON_MESSAGES } from "@/shared/config";
import { LoadingMessage } from "@/shared/ui";

export function MyStaysPage() {
  return (
    <section className="flex flex-col gap-6 px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900">
        {COMMON_MESSAGES.myStays}
      </h1>
      <Suspense fallback={<LoadingMessage />}>
        <MyStays />
      </Suspense>
    </section>
  );
}
