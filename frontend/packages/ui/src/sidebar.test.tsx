import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sidebar, SidebarItem } from "./sidebar";

describe("Sidebar", () => {
  it("전달받은 이름의 내비게이션 안에 메뉴 목록을 보여준다", () => {
    render(
      <Sidebar aria-label="주 메뉴">
        <SidebarItem>
          <a href="/">홈</a>
        </SidebarItem>
        <SidebarItem>
          <a href="/hotels">호텔</a>
        </SidebarItem>
      </Sidebar>,
    );

    const navigation = screen.getByRole("navigation", { name: "주 메뉴" });
    const items = within(navigation).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[1]).getByRole("link", { name: "호텔" })).toBeVisible();
  });

  it("aria-current가 page인 링크만 현재 페이지 메뉴로 읽힌다", () => {
    render(
      <Sidebar aria-label="주 메뉴">
        <SidebarItem>
          <a href="/" aria-current="page">
            홈
          </a>
        </SidebarItem>
        <SidebarItem>
          <a href="/hotels">호텔</a>
        </SidebarItem>
      </Sidebar>,
    );

    expect(screen.getByRole("link", { current: "page" })).toHaveAccessibleName(
      "홈",
    );
    expect(
      screen.getByRole("link", { name: "호텔", current: false }),
    ).toBeInTheDocument();
  });

  it("메뉴 항목은 aria-current가 page인 링크에 활성 스타일을 적용한다", () => {
    render(
      <SidebarItem>
        <a href="/" aria-current="page">
          홈
        </a>
      </SidebarItem>,
    );

    expect(screen.getByRole("listitem")).toHaveClass(
      "*:aria-[current=page]:bg-neutral-100",
      "*:aria-[current=page]:font-semibold",
    );
  });
});
