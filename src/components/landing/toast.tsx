"use client";

import { useEffect } from "react";

interface ToastProps {
  visible: boolean;
  message?: string;
  /** Auto-dismiss timeout in ms. */
  duration?: number;
  onHide: () => void;
}

/** Fixed-position bottom-center toast used for "Coming soon" feedback. */
export function Toast({
  visible,
  message = "Coming soon — stay tuned",
  duration = 2500,
  onHide,
}: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(onHide, duration);
    return () => clearTimeout(id);
  }, [visible, duration, onHide]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: `translate(-50%, ${visible ? 0 : 12}px)`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity .25s ease, transform .25s ease",
        zIndex: 100,
        padding: "10px 18px",
        background: "var(--ink)",
        color: "var(--bg)",
        fontFamily: "var(--mono)",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        borderRadius: 999,
        boxShadow: "0 8px 24px -8px rgba(0,0,0,0.25)",
      }}
    >
      {message}
    </div>
  );
}
