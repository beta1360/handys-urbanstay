import type { MyStay } from "@/shared/api";
import { MY_STAY_MESSAGES } from "../config/messages";
import type { MyStaySections } from "../lib/my-stay-sections";
import { MyStayCard } from "./my-stay-card";

type MyStayListViewProps = {
  sections: MyStaySections;
};

type MyStaySectionProps = {
  title: string;
  stays: MyStay[];
};

function MyStaySection({ title, stays }: MyStaySectionProps) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {stays.length === 0 ? (
        <p className="text-sm text-gray-500">{MY_STAY_MESSAGES.sectionEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {stays.map((stay) => (
            <li key={stay.id}>
              <MyStayCard stay={stay} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function MyStayListView({ sections }: MyStayListViewProps) {
  return (
    <div className="flex flex-col gap-8">
      <MyStaySection
        title={MY_STAY_MESSAGES.upcomingTitle}
        stays={sections.upcoming}
      />
      <MyStaySection title={MY_STAY_MESSAGES.pastTitle} stays={sections.past} />
    </div>
  );
}
