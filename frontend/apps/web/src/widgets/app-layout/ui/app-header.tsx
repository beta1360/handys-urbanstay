import { Suspense } from "react";
import { APP_INFO } from "@/shared/config";
import { HeaderAuth } from "./header-auth";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4">
      <span className="text-lg font-bold">{APP_INFO.name}</span>
      <Suspense fallback={null}>
        <HeaderAuth />
      </Suspense>
    </header>
  );
}
