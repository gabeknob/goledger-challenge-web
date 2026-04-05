import { act, renderHook } from "@testing-library/react";

import { useDebouncedState } from "#/hooks/useDebouncedState";

describe("useDebouncedState", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits 500ms before updating the debounced value", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ delayMs, value }) => useDebouncedState(value, delayMs),
      {
        initialProps: {
          delayMs: 500,
          value: "",
        },
      },
    );

    rerender({ delayMs: 500, value: "ted" });

    expect(result.current.debouncedValue).toBe("");
    expect(result.current.isDebouncing).toBe(true);

    act(() => {
      vi.advanceTimersByTime(499);
    });

    expect(result.current.debouncedValue).toBe("");
    expect(result.current.isDebouncing).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.debouncedValue).toBe("ted");
    expect(result.current.isDebouncing).toBe(false);
  });
});
