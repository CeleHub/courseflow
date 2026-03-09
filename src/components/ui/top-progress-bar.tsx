"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Spec 18.3: Page Transition Progress Bar
 * Slim 3px bar at top of viewport, above topbar, z-index 100.
 * Indigo. 0% → ~70% quickly → 100% when page loads → fades out.
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const prevPathname = useRef(pathname);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;

      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Reset and show
      setFading(false);
      setWidth(0);
      setVisible(true);

      // 0% → 70% quickly (~250ms)
      const t1 = setTimeout(() => setWidth(70), 50);
      timeoutRef.current = t1;

      // 70% → 100% when "page data loaded" (~400ms from start)
      const t2 = setTimeout(() => {
        setWidth(100);
        timeoutRef.current = null;
      }, 450);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [pathname]);

  useEffect(() => {
    if (width === 100 && visible && !fading) {
      // Complete: fade out after brief hold
      const t = setTimeout(() => {
        setFading(true);
      }, 150);
      const t2 = setTimeout(() => {
        setVisible(false);
        setWidth(0);
        setFading(false);
      }, 350);
      return () => {
        clearTimeout(t);
        clearTimeout(t2);
      };
    }
  }, [width, visible, fading]);

  if (!visible) return null;

  return (
    <div
      className="fixed left-0 top-0 right-0 h-[3px] z-[100] overflow-hidden"
      aria-hidden
    >
      <div
        className="h-full bg-indigo-600 ease-out"
        style={{
          width: `${width}%`,
          opacity: fading ? 0 : 1,
          transition: fading ? "opacity 200ms ease-out" : "width 200ms ease-out",
        }}
      />
    </div>
  );
}
