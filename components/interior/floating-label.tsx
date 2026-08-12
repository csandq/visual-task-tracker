"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";

export type FloatingLabelInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  hint?: string;
  invalid?: boolean;
  autoComplete?: string;
  inputMode?: React.ComponentProps<"input">["inputMode"];
};

export function FloatingLabelInput({ label, value, onChange, id, name, hint, invalid = false, autoComplete = "off", inputMode = "text" }: FloatingLabelInputProps) {
  const uid = useId();
  const fieldId = id ?? `${uid}-field`;
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;
  const reduced = useReducedMotion();
  return <div className="floating-label-field">
    <div className={`floating-label-shell ${focused ? "focused" : ""} ${invalid ? "invalid" : ""}`}>
      <input id={fieldId} name={name} value={value} autoComplete={autoComplete} inputMode={inputMode} aria-invalid={invalid || undefined} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={(event) => onChange(event.currentTarget.value)} />
      <motion.label htmlFor={fieldId} initial={false} animate={{ y: raised ? -25 : 0, x: raised ? -7 : 0, scale: raised ? .88 : 1 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 760, damping: 46, mass: .5 }} className={raised ? "raised" : ""}>{label}</motion.label>
    </div>
    <p className={`floating-label-hint ${invalid ? "invalid" : ""}`}>{hint ?? " "}</p>
  </div>;
}
