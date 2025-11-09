import { createContext, useContext, useState, useCallback } from "react";

type ToastMsg = { id: string; text: string };
type Ctx = { push: (text: string) => void };
const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<ToastMsg[]>([]);
  const push = useCallback((text: string) => {
    const id = crypto.randomUUID();
    setList((l) => [...l, { id, text }]);
    setTimeout(() => setList((l) => l.filter(t => t.id !== id)), 2500);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-[9999]">
        {list.map(t => (
          <div key={t.id} className="px-4 py-2 rounded-xl border bg-white shadow text-sm">
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
