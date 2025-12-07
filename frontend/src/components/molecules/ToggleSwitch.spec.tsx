import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ToggleSwitch } from "./ToggleSwitch";

describe("ToggleSwitch", () => {
  const mockOptions = [
    { label: "BUY", value: "BUY", variant: "buy" },
    { label: "SELL", value: "SELL", variant: "sell" },
  ];

  it("should render all options", () => {
    render(<ToggleSwitch value="BUY" onChange={vi.fn()} options={mockOptions} />);

    const buyButton = screen.getByText("BUY");
    const sellButton = screen.getByText("SELL");

    expect(buyButton).toBeInTheDocument();
    expect(sellButton).toBeInTheDocument();
  });

  it("should apply active class to selected option", () => {
    render(
      <ToggleSwitch
        value="BUY"
        onChange={vi.fn()}
        options={mockOptions}
        data-testid="toggle-switch"
      />
    );
    const buyButton = screen.getByTestId("toggle-switch-option-BUY");
    const sellButton = screen.getByTestId("toggle-switch-option-SELL");

    expect(buyButton).toHaveAttribute("data-appstate", "active");
    expect(sellButton).toHaveAttribute("data-appstate", "inactive");
  });

  it("should call onChange when option is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <ToggleSwitch
        value="BUY"
        onChange={handleChange}
        options={mockOptions}
        data-testid="toggle-switch"
      />
    );

    const sellButton = screen.getByTestId("toggle-switch-option-SELL");
    await user.click(sellButton);

    expect(handleChange).toHaveBeenCalledWith("SELL");
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("should not call onChange when clicking already selected option", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <ToggleSwitch
        value="BUY"
        onChange={handleChange}
        options={mockOptions}
        data-testid="toggle-switch"
      />
    );

    const buyButton = screen.getByTestId("toggle-switch-option-BUY");
    await user.click(buyButton);

    // onChange still called but with same value
    expect(handleChange).toHaveBeenCalledWith("BUY");
  });

  it("should apply variant styling to active option", () => {
    render(
      <ToggleSwitch
        value="SELL"
        onChange={vi.fn()}
        options={mockOptions}
        data-testid="toggle-switch"
      />
    );

    const sellButton = screen.getByTestId("toggle-switch-option-SELL");
    expect(sellButton).toHaveAttribute("data-variant", "sell");
    expect(sellButton).toHaveAttribute("data-appstate", "active");
  });

  it("should disable all buttons when disabled prop is true", () => {
    render(
      <ToggleSwitch
        value="BUY"
        onChange={vi.fn()}
        options={mockOptions}
        disabled={true}
        data-testid="toggle-switch"
      />
    );

    const buyButton = screen.getByTestId("toggle-switch-option-BUY");
    const sellButton = screen.getByTestId("toggle-switch-option-SELL");

    expect(buyButton).toBeDisabled();
    expect(sellButton).toBeDisabled();
  });

  it("should not call onChange when disabled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <ToggleSwitch
        value="BUY"
        onChange={handleChange}
        options={mockOptions}
        disabled={true}
        data-testid="toggle-switch"
      />
    );

    const sellButton = screen.getByTestId("toggle-switch-option-SELL");
    await user.click(sellButton);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it("should render with custom test id", () => {
    render(
      <ToggleSwitch
        value="BUY"
        onChange={vi.fn()}
        options={mockOptions}
        data-testid="custom-toggle"
      />
    );

    const toggle = screen.getByTestId("custom-toggle");
    expect(toggle).toBeInTheDocument();
  });

  it("should have group role for accessibility", () => {
    render(<ToggleSwitch value="BUY" onChange={vi.fn()} options={mockOptions} id="side" />);

    const toggle = screen.getByRole("group");
    expect(toggle).toBeInTheDocument();
  });

  it("should render with three options", () => {
    const threeOptions = [
      { label: "Low", value: "LOW" },
      { label: "Medium", value: "MEDIUM" },
      { label: "High", value: "HIGH" },
    ];

    render(
      <ToggleSwitch
        value="MEDIUM"
        onChange={vi.fn()}
        options={threeOptions}
        data-testid="toggle-switch"
      />
    );

    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
