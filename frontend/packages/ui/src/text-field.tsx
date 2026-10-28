import { useId } from "react";
import type { ComponentProps, ReactNode } from "react";
import { joinClassNames } from "./class-names";

type TextFieldProps = Omit<ComponentProps<"input">, "children"> & {
  label: ReactNode;
  error?: ReactNode;
};

export function TextField({
  label,
  error,
  id,
  className,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hasError = Boolean(error);

  return (
    <div className={joinClassNames("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-neutral-900"
      >
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500 aria-invalid:border-red-600 aria-invalid:focus-visible:outline-red-600"
      />
      {hasError ? (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
