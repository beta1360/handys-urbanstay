import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./pagination";

function renderPagination({ hasPrevious = true, hasNext = true } = {}) {
  const onPrevious = vi.fn();
  const onNext = vi.fn();
  render(
    <Pagination
      aria-label="페이지 이동"
      status="2 / 3 페이지"
      previousLabel="이전"
      nextLabel="다음"
      hasPrevious={hasPrevious}
      hasNext={hasNext}
      onPrevious={onPrevious}
      onNext={onNext}
    />,
  );
  return { onPrevious, onNext };
}

describe("Pagination", () => {
  it("전달받은 이름의 내비게이션 안에 이전·다음 버튼과 현재 위치를 보여준다", () => {
    renderPagination();

    const navigation = screen.getByRole("navigation", { name: "페이지 이동" });
    expect(
      within(navigation).getByRole("button", { name: "이전" }),
    ).toHaveAttribute("type", "button");
    expect(
      within(navigation).getByRole("button", { name: "다음" }),
    ).toHaveAttribute("type", "button");
    expect(within(navigation).getByText("2 / 3 페이지")).toBeInTheDocument();
  });

  it("이전·다음 버튼을 누르면 각 콜백을 호출한다", async () => {
    const user = userEvent.setup();
    const { onPrevious, onNext } = renderPagination();

    await user.click(screen.getByRole("button", { name: "이전" }));
    await user.click(screen.getByRole("button", { name: "다음" }));

    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("이전·다음 페이지가 없으면 그 버튼을 비활성화해 콜백을 호출하지 않는다", async () => {
    const user = userEvent.setup();
    const { onPrevious, onNext } = renderPagination({
      hasPrevious: false,
      hasNext: false,
    });

    const previousButton = screen.getByRole("button", { name: "이전" });
    const nextButton = screen.getByRole("button", { name: "다음" });
    await user.click(previousButton);
    await user.click(nextButton);

    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
    expect(onPrevious).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });
});
