import { HOME_MESSAGES } from "../config/messages";

export function HomePage() {
  return (
    <section>
      <p className="text-sm text-neutral-500">{HOME_MESSAGES.placeholder}</p>
    </section>
  );
}
