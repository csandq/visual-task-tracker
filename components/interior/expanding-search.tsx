"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function ExpandingSearch({ value, onChange, placeholder = "Search", onSubmit }: { value: string; onChange: (value: string) => void; placeholder?: string; onSubmit?: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside, true);
    return () => document.removeEventListener("pointerdown", closeOutside, true);
  }, [open]);
  return <div ref={rootRef} className={`expanding-search ${open ? "open" : ""}`}>
    <motion.div animate={{ width: open ? 240 : 38 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 38 }} className="expanding-search-shell">
      <input value={value} onChange={(event) => onChange(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") onSubmit?.(value); if (event.key === "Escape") { onChange(""); setOpen(false); } }} onFocus={() => setOpen(true)} placeholder={placeholder} aria-label={placeholder} autoComplete="off" spellCheck={false} />
      {value && <button type="button" onClick={() => onChange("")} aria-label="Clear search">×</button>}
      <button type="button" onClick={() => setOpen(true)} aria-label="Search"><svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><circle cx="6.4" cy="6.4" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9.8 9.8 13.2 13.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg></button>
    </motion.div>
  </div>;
}
