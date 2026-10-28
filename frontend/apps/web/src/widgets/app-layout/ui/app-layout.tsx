import type { ReactNode } from "react";
import { AppHeader } from "./app-header";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white">
      <AppHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
