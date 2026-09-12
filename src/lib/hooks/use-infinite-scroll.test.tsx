import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useInfiniteScroll } from "./use-infinite-scroll";

/**
 * jsdom no implementa IntersectionObserver, así que lo sustituimos por uno falso
 * que además nos deja disparar la intersección a mano.
 */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  observed: Element[] = [];
  disconnected = false;

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(element: Element) {
    this.observed.push(element);
  }

  unobserve() {}

  disconnect() {
    this.disconnected = true;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Simula que el centinela entra (o sale) de la pantalla. */
  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);

function Probe({ enabled, onIntersect }: { enabled: boolean; onIntersect: () => void }) {
  const sentinelRef = useInfiniteScroll<HTMLDivElement>(onIntersect, { enabled });
  return <div ref={sentinelRef} />;
}

afterEach(() => {
  FakeIntersectionObserver.instances = [];
});

describe("useInfiniteScroll", () => {
  it("pide la página siguiente cuando el centinela entra en pantalla", () => {
    const onIntersect = vi.fn();
    render(<Probe enabled onIntersect={onIntersect} />);

    FakeIntersectionObserver.instances[0]?.trigger(true);

    expect(onIntersect).toHaveBeenCalledTimes(1);
  });

  it("no pide nada si el centinela no está visible", () => {
    const onIntersect = vi.fn();
    render(<Probe enabled onIntersect={onIntersect} />);

    FakeIntersectionObserver.instances[0]?.trigger(false);

    expect(onIntersect).not.toHaveBeenCalled();
  });

  it("no observa nada mientras está deshabilitado", () => {
    render(<Probe enabled={false} onIntersect={vi.fn()} />);

    expect(FakeIntersectionObserver.instances).toHaveLength(0);
  });

  it("observa el elemento del centinela", () => {
    render(<Probe enabled onIntersect={vi.fn()} />);

    expect(FakeIntersectionObserver.instances[0]?.observed).toHaveLength(1);
  });

  it("deja de observar al desmontarse", () => {
    const { unmount } = render(<Probe enabled onIntersect={vi.fn()} />);

    unmount();

    expect(FakeIntersectionObserver.instances[0]?.disconnected).toBe(true);
  });
});
