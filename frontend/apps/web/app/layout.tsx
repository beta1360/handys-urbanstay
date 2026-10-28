import type { Metadata } from "next";
import { AppLayout, AppProviders } from "@/_app";
import { APP_INFO } from "@/shared/config";
import "@/_app/styles/globals.css";

export const metadata: Metadata = {
  title: APP_INFO.name,
  description: APP_INFO.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="antialiased">
      <body className="bg-gray-100">
        <AppProviders>
          <AppLayout>{children}</AppLayout>
        </AppProviders>
      </body>
    </html>
  );
}
