import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function Input({ label, hint, id, className = '', ...props }: Props) {
  const inputId = id ?? label.toLowerCase().replace(/\s/g, '-');
  return (
    <label className={`field ${className}`.trim()} htmlFor={inputId}>
      <span className="field-label">{label}</span>
      <input id={inputId} className="field-input" {...props} />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
