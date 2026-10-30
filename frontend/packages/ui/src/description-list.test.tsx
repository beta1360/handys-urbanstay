import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DescriptionList, DescriptionListItem } from "./description-list";

describe("DescriptionList", () => {
  it("항목 이름과 값을 dl 안의 dt·dd로 순서대로 보여준다", () => {
    render(
      <DescriptionList data-testid="list">
        <DescriptionListItem term="이름">101</DescriptionListItem>
        <DescriptionListItem term="층">
          <strong>12층</strong>
        </DescriptionListItem>
      </DescriptionList>,
    );

    const terms = screen.getAllByRole("term");
    const definitions = screen.getAllByRole("definition");
    expect(terms.map((term) => term.textContent)).toEqual(["이름", "층"]);
    expect(definitions.map((definition) => definition.textContent)).toEqual([
      "101",
      "12층",
    ]);
    expect(terms[0].tagName).toBe("DT");
    expect(definitions[0].tagName).toBe("DD");
    expect(screen.getByTestId("list").tagName).toBe("DL");
  });

  it("값은 줄바꿈을 살려 보여준다", () => {
    render(
      <DescriptionList>
        <DescriptionListItem term="소개">
          {"첫 줄\n둘째 줄"}
        </DescriptionListItem>
      </DescriptionList>,
    );

    const definition = screen.getByRole("definition");
    expect(definition).toHaveTextContent("첫 줄\n둘째 줄", {
      normalizeWhitespace: false,
    });
    expect(definition).toHaveClass("whitespace-pre-line");
  });

  it("className은 목록과 항목의 기본 스타일에 덧붙인다", () => {
    render(
      <DescriptionList data-testid="list" className="mt-4">
        <DescriptionListItem data-testid="item" term="이름" className="px-2">
          101
        </DescriptionListItem>
      </DescriptionList>,
    );

    expect(screen.getByTestId("list")).toHaveClass("mt-4", "divide-y");
    expect(screen.getByTestId("item")).toHaveClass("px-2", "grid");
  });
});
