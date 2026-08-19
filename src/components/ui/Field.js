"use client";

/**
 * Label + Field — form field scaffolding with label, optional
 * required marker, hint and error message wired for a11y.
 *
 *   <Field label="Email" htmlFor="email" error={errors.email} required>
 *     <Input id="email" type="email" invalid={!!errors.email} />
 *   </Field>
 */

export function Label({ className = "", required = false, children, ...props }) {
  return (
    <label className={`block text-sm font-medium text-foreground ${className}`} {...props}>
      {children}
      {required && <span className="text-danger ms-0.5" aria-hidden="true">*</span>}
    </label>
  );
}

export default function Field({
  label, htmlFor, hint, error, required = false, className = "", children,
}) {
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined;
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>{label}</Label>
      )}
      {children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
