import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./card";

describe("Card", () => {
  it("내용을 테두리가 있는 흰색 카드 안에 보여준다", () => {
    render(<Card data-testid="card">내용</Card>);

    const card = screen.getByTestId("card");
    expect(card).toHaveClass("border", "border-neutral-200", "bg-white");
    expect(card).toHaveTextContent("내용");
  });

  it("header를 넘기면 내용 위에 보여준다", () => {
    render(<Card header={<h2>로그인</h2>}>내용</Card>);

    const heading = screen.getByRole("heading", { name: "로그인" });
    const content = screen.getByText("내용");
    expect(
      heading.compareDocumentPosition(content) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
