import { useEffect, useState } from "react";

export function useDebouncedState<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (value === debouncedValue) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [debouncedValue, delayMs, value]);

  return {
    debouncedValue,
    isDebouncing: value !== debouncedValue,
  };
}
