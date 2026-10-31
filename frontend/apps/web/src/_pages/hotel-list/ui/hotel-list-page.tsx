import { Suspense } from "react";
import { HotelList } from "@/entities/hotel";
import { LoadingMessage } from "@/shared/ui";
import { HOTEL_LIST_PAGE_MESSAGES } from "../config/messages";

export function HotelListPage() {
  return (
    <section className="flex flex-col gap-4 px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900">
        {HOTEL_LIST_PAGE_MESSAGES.title}
      </h1>
      <Suspense fallback={<LoadingMessage />}>
        <HotelList />
      </Suspense>
    </section>
  );
}
