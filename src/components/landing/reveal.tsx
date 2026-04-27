"use client";

import { useEffect, useRef, type ReactNode, type ElementType } from "react";

interface RevealProps {
  children: ReactNode;
  /** Render as a different tag (defaults to a div). */
  as?: ElementType;
  className?: string;
  onClick?: () => void;
}

/**
 * Fades and lifts content into view as it enters the viewport.
 * Pairs with the `.reveal` / `.reveal.in` styles in landing.css.
 */
export function Reveal({ children, as: Tag = "div", className = "", onClick }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()} onClick={onClick}>
      {children}
    </Tag>
  );
}
