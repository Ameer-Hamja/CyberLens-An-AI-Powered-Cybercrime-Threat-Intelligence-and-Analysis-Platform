import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";
export default function Modal({
  open,
  onClose,
  title,
  children,
  drawer = false,
}) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    function keydown(event) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = [
        ...ref.current.querySelectorAll(
          'button, a[href], input, select, textarea, [tabindex="0"]',
        ),
      ].filter((el) => !el.disabled && el.getClientRects().length);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === ref.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-[1500] flex bg-slate-950/65 backdrop-blur-sm",
        drawer ? "justify-end" : "items-center justify-center p-4",
      )}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={clsx(
          "w-full overflow-y-auto bg-white text-slate-900 shadow-2xl outline-none dark:bg-slate-900 dark:text-slate-100",
          drawer
            ? "h-full max-w-lg border-l border-slate-200 dark:border-slate-700"
            : "max-h-[90dvh] max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700",
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 p-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
