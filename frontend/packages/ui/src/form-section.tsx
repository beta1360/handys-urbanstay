import type { ReactNode } from "react";
import { Card } from "./card";

type FormSectionProps = {
  legend: ReactNode;
  children: ReactNode;
};

export function FormSection({ legend, children }: FormSectionProps) {
  return (
    <Card>
      <fieldset className="min-w-0">
        <legend className="text-base font-semibold text-neutral-900">
          {legend}
        </legend>
        <div className="mt-4 flex flex-col gap-4">{children}</div>
      </fieldset>
    </Card>
  );
}
