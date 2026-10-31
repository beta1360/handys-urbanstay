import { COMMON_MESSAGES, ROUTES } from "@/shared/config";
import { ButtonLink } from "@/shared/ui";
import { NOT_FOUND_PAGE_MESSAGES } from "../config/messages";

export function NotFoundPage() {
  return (
    <section className="flex flex-col gap-4 px-4 py-10 text-center">
      <h1 className="text-xl font-bold text-gray-900">
        {NOT_FOUND_PAGE_MESSAGES.title}
      </h1>
      <p className="text-sm text-gray-500">
        {NOT_FOUND_PAGE_MESSAGES.description}
      </p>
      <ButtonLink href={ROUTES.hotels} variant="secondary">
        {COMMON_MESSAGES.backToHotels}
      </ButtonLink>
    </section>
  );
}
