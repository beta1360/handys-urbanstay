import { APP_INFO } from "@/shared/config";
import { APP_HEADER_MESSAGES } from "../config/messages";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4">
      <span className="text-lg font-bold">{APP_INFO.name}</span>
      <button
        type="button"
        aria-label={APP_HEADER_MESSAGES.myPageLabel}
        className="flex size-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-6"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" />
        </svg>
      </button>
    </header>
  );
}
