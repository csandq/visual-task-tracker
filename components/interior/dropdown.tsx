"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export type DropdownItem = { value: string; label: string; hint?: string };
export function Dropdown({ items, value, onChange, label }: { items: DropdownItem[]; value: string; onChange: (value: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const selected = items.find((item) => item.value === value);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside, true);
    return () => document.removeEventListener("pointerdown", closeOutside, true);
  }, [open]);
  return <div ref={rootRef} className="interior-dropdown"><button type="button" aria-label={label} aria-expanded={open} onClick={() => setOpen((current) => !current)}>{selected?.label ?? items[0]?.label}<span>⌄</span></button><AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -6, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={reduced ? { duration: 0 } : undefined} className="interior-dropdown-menu">{items.map((item) => <button type="button" key={item.value} className={item.value === value ? "selected" : ""} onClick={() => { onChange(item.value); setOpen(false); }}>{item.label}{item.value === value && <span>✓</span>}</button>)}</motion.div>}</AnimatePresence></div>;
}
