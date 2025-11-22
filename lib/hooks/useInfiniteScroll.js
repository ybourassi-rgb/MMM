import { useEffect, useRef } from "react";

export function useInfiniteScroll({ onLoadMore, hasMore, rootMargin = "600px" }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [onLoadMore, hasMore, rootMargin]);

  return ref;
}
