import type { ReactNode } from "react";
import type { MyStay } from "@/shared/api";
import { MY_STAY_MESSAGES } from "../config/messages";
import type { MyStaySections } from "../model/use-my-stay-feed";
import { MyStayCard } from "./my-stay-card";

type MyStayListViewProps = {
  sections: MyStaySections;
  children: ReactNode;
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

export function MyStayListView({ sections, children }: MyStayListViewProps) {
  return (
    <div className="flex flex-col gap-8">
      <MyStaySection
        title={MY_STAY_MESSAGES.upcomingTitle}
        stays={sections.upcoming}
      />
      {sections.past === undefined ? null : (
        <MyStaySection
          title={MY_STAY_MESSAGES.pastTitle}
          stays={sections.past}
        />
      )}
      {children}
    </div>
  );
}
