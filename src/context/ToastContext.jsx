/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useMemo, useState } from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";
import { generateId } from "../utils/generateId";
import { cn } from "../utils/cn";

export const ToastContext = createContext(null);

const TOAST_META = {
  success: { icon: FiCheckCircle, accent: "text-emerald-400" },
  error: { icon: FiAlertCircle, accent: "text-rose-400" },
  info: { icon: FiInfo, accent: "text-sky-400" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type = "info", title, message }) => {
      const id = generateId("toast");
      setToasts((prev) => [...prev, { id, type, title, message }]);
      window.setTimeout(() => dismiss(id), 4800);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({ toasts, toast, dismiss }),
    [toasts, toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => {
          const meta = TOAST_META[t.type] || TOAST_META.info;
          const Icon = meta.icon;
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-elevated/95 p-4 shadow-2xl shadow-black/40 backdrop-blur"
              role="status"
            >
              <Icon size={20} className={cn("mt-0.5 shrink-0", meta.accent)} />
              <div className="min-w-0 flex-1">
                {t.title && (
                  <p className="text-sm font-semibold text-ink">{t.title}</p>
                )}
                {t.message && (
                  <p className="mt-0.5 text-sm leading-snug text-ink-soft">{t.message}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-1 text-ink-mute transition hover:bg-surface-2 hover:text-ink"
                aria-label="Dismiss notification"
              >
                <FiX size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
