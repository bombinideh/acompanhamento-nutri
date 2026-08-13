"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

type Props = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  labelStyle?: CSSProperties;
  placeholder?: string;
  icon?: ReactNode;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  labelStyle,
  placeholder,
  icon,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {label ? (
        <label className="field" htmlFor={id} style={labelStyle}>
          {label}
        </label>
      ) : null}
      <div className={`password-wrap ${icon ? "has-icon" : ""}`}>
        {icon ? <span className="field-icon">{icon}</span> : null}
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
        />
        <button
          className="password-toggle"
          type="button"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-4.2 5.1" />
      <path d="M6.1 6.1C3.9 7.8 2 12 2 12s3.5 7 10 7a11 11 0 0 0 4.1-.7" />
    </svg>
  );
}
