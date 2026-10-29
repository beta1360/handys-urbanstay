import { useCurrentTitle } from "../model/use-current-title";

export function AdminHeader() {
  const currentTitle = useCurrentTitle();

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-neutral-200 bg-white px-6">
      {currentTitle ? (
        <h1 className="text-lg font-semibold text-neutral-900">
          {currentTitle}
        </h1>
      ) : null}
    </header>
  );
}
