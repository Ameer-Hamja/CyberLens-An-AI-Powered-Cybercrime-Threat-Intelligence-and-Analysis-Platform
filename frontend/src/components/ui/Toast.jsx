import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import clsx from "clsx";
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const timers = useRef(new Set());
  const dismiss = useCallback(
    (id) => setItems((previous) => previous.filter((item) => item.id !== id)),
    [],
  );
  const toast = useCallback(
    (message, tone = "success") => {
      const id = crypto.randomUUID();
      setItems((previous) => [...previous.slice(-3), { id, message, tone }]);
      const timer = setTimeout(() => {
        dismiss(id);
        timers.current.delete(timer);
      }, 5500);
      timers.current.add(timer);
    },
    [dismiss],
  );
  useEffect(() => {
    const active = timers.current;
    return () => active.forEach(clearTimeout);
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed bottom-24 right-4 z-[2000] flex w-[calc(100%-32px)] max-w-sm flex-col gap-3 md:bottom-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className="card pointer-events-auto flex items-start gap-3 bg-white p-4 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100"
          >
            <span
              className={clsx(
                "mt-0.5",
                item.tone === "error"
                  ? "text-red-600 dark:text-red-400"
                  : "text-emerald-500",
              )}
            >
              {item.tone === "error" ? (
                <AlertCircle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </span>
            <p className="min-w-0 flex-1 break-words text-sm leading-relaxed">
              {item.message}
            </p>
            <button
              aria-label="Dismiss notification"
              onClick={() => dismiss(item.id)}
              className="rounded p-1 text-slate-600 dark:text-slate-400"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
