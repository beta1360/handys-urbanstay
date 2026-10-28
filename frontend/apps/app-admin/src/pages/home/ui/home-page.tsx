import { HOME_MESSAGES } from "../config/messages";

export function HomePage() {
  return (
    <section className="px-4 py-6">
      <p className="text-sm text-gray-500">{HOME_MESSAGES.placeholder}</p>
    </section>
  );
}
