import type { ComponentProps, ReactNode } from "react";
import { Button } from "./button";
import { joinClassNames } from "./class-names";

type PaginationProps = Omit<ComponentProps<"nav">, "children"> & {
  "aria-label": string;
  status: ReactNode;
  previousLabel: ReactNode;
  nextLabel: ReactNode;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function Pagination({
  status,
  previousLabel,
  nextLabel,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  className,
  ...props
}: PaginationProps) {
  return (
    <nav
      {...props}
      className={joinClassNames(
        "flex items-center justify-center gap-3",
        className,
      )}
    >
      <Button
        type="button"
        variant="secondary"
        disabled={!hasPrevious}
        onClick={onPrevious}
      >
        {previousLabel}
      </Button>
      <span className="text-sm text-neutral-700">{status}</span>
      <Button
        type="button"
        variant="secondary"
        disabled={!hasNext}
        onClick={onNext}
      >
        {nextLabel}
      </Button>
    </nav>
  );
}
