import type { ReactNode } from "react";
import { QueryProvider } from "../query/query-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
