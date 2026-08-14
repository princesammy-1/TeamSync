/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";

const DropdownContext = createContext(null);

export function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("Dropdown.Item must be used inside a Dropdown");
  return ctx;
}

export default function Dropdown({ trigger, children, align = "right", className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const position = {
    right: "right-0",
    left: "left-0",
  };

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-40 mt-1.5 min-w-44 overflow-hidden rounded-lg border border-border bg-elevated p-1 shadow-xl shadow-black/40",
            position[align],
            className,
          )}
        >
          <DropdownContext.Provider value={{ setOpen }}>{children}</DropdownContext.Provider>
        </div>
      )}
    </div>
  );
}

function Item({ children, onClick, icon, destructive = false, className = "" }) {
  const { setOpen } = useDropdown();

  return (
    <button
      role="menuitem"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
        destructive
          ? "text-rose-400 hover:bg-rose-500/10"
          : "text-ink-soft hover:bg-surface-2 hover:text-ink",
        className,
      )}
    >
      {icon && <span className="text-[15px]">{icon}</span>}
      {children}
    </button>
  );
}

function Separator() {
  return <div className="mx-1 my-1 h-px bg-border-subtle" />;
}

function Label({ children, className = "" }) {
  return (
    <p className={cn("px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-ink-mute uppercase", className)}>
      {children}
    </p>
  );
}

Dropdown.Item = Item;
Dropdown.Separator = Separator;
Dropdown.Label = Label;
