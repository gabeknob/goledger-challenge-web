class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;

  private readonly callback: IntersectionObserverCallback;
  private readonly elements = new Set<Element>();

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.rootMargin = options?.rootMargin ?? "";
    this.thresholds = Array.isArray(options?.threshold)
      ? options.threshold
      : [options?.threshold ?? 0];
  }

  disconnect() {
    this.elements.clear();
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  trigger(isIntersecting: boolean, target?: Element) {
    const entryTarget = target ?? [...this.elements][0];

    if (!entryTarget) {
      return;
    }

    this.callback(
      [
        {
          boundingClientRect: entryTarget.getBoundingClientRect(),
          intersectionRatio: isIntersecting ? 1 : 0,
          intersectionRect: isIntersecting
            ? entryTarget.getBoundingClientRect()
            : new DOMRectReadOnly(),
          isIntersecting,
          rootBounds: null,
          target: entryTarget,
          time: Date.now(),
        },
      ],
      this,
    );
  }
}

class MockResizeObserver implements ResizeObserver {
  disconnect() {}

  observe() {}

  unobserve() {}
}

const observers: MockIntersectionObserver[] = [];

function createMatchMediaResult(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    addListener: () => {},
    dispatchEvent: () => false,
    removeEventListener: () => {},
    removeListener: () => {},
  };
}

export function installBrowserMocks() {
  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: class IntersectionObserverMock extends MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback, options);
        observers.push(this);
      }
    },
  });

  Object.defineProperty(window, "ResizeObserver", {
    configurable: true,
    writable: true,
    value: MockResizeObserver,
  });

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => createMatchMediaResult(query),
  });

  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    writable: true,
    value: () => {},
  });

  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    writable: true,
    value: () => {},
  });
}

export function resetBrowserMocks() {
  observers.length = 0;
}

export function getIntersectionObservers() {
  return observers;
}
