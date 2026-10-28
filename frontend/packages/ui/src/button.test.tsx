import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("variant를 지정하지 않으면 primary 스타일로 보여준다", () => {
    render(<Button>저장</Button>);

    const button = screen.getByRole("button", { name: "저장" });
    expect(button).toHaveClass("bg-neutral-900", "text-white");
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it.each([
    ["primary", ["bg-neutral-900", "text-white"]],
    ["secondary", ["border-neutral-200", "bg-white", "text-neutral-900"]],
    ["ghost", ["text-neutral-900", "enabled:hover:bg-neutral-100"]],
  ] as const)("%s variant는 그에 맞는 스타일로 보여준다", (variant, classNames) => {
    render(<Button variant={variant}>저장</Button>);

    expect(screen.getByRole("button", { name: "저장" })).toHaveClass(
      ...classNames,
    );
  });

  it("className을 넘기면 기본 스타일에 덧붙인다", () => {
    render(<Button className="w-full">저장</Button>);

    expect(screen.getByRole("button", { name: "저장" })).toHaveClass(
      "w-full",
      "bg-neutral-900",
    );
  });

  it("클릭하면 onClick을 호출한다", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>저장</Button>);

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("disabled이면 비활성화되어 클릭해도 onClick을 호출하지 않는다", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        저장
      </Button>,
    );

    const button = screen.getByRole("button", { name: "저장" });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("loading이면 비활성화되고 aria-busy로 처리 중임을 알린다", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button loading onClick={handleClick}>
        저장 중
      </Button>,
    );

    const button = screen.getByRole("button", { name: "저장 중" });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(handleClick).not.toHaveBeenCalled();
  });
});
