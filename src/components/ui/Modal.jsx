import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { cn } from "../../utils/cn";

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    const prev = dialogRef.current?.previousElementSibling;
    if (prev) prev.setAttribute("inert", "");

    const timer = window.setTimeout(() => dialogRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      if (prev) prev.removeAttribute("inert");
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[90vh] w-full flex-col rounded-xl border border-border bg-elevated shadow-2xl shadow-black/50",
          sizes[size],
        )}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
            <div>
              {title && (
                <h2 id="modal-title" className="text-base font-semibold text-ink">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-0.5 text-sm text-ink-soft">{description}</p>
              )}
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="shrink-0 rounded-md p-1 text-ink-mute transition hover:bg-surface-2 hover:text-ink"
                aria-label="Close dialog"
              >
                <FiX size={18} />
              </button>
            )}
          </div>
        )}

        <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
