import React, { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    id,
    label,
    error,
    hint,
    icon,
    className = '',
    required = false,
    disabled = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const errorId = inputId && error ? `${inputId}-error` : undefined;
  const hintId = inputId && hint ? `${inputId}-hint` : undefined;

  return (
    <div className="ui-field-wrap">
      {label && (
        <label className="ui-field-label" htmlFor={inputId}>
          <span>
            {label}
            {required && <span style={{ color: 'var(--danger)', marginLeft: '0.2rem' }}>*</span>}
          </span>
        </label>
      )}
      <div className="ui-input-container">
        {icon && <span className="input-icon" aria-hidden="true">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={`ui-input ${icon ? 'has-icon' : ''} ${error ? 'has-error' : ''} ${className}`.trim()}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          {...props}
        />
      </div>
      {hint && !error && (
        <span id={hintId} className="ui-field-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="ui-field-error" role="alert">
          <span aria-hidden="true">⚠</span>
          {error}
        </span>
      )}
    </div>
  );
});

export default Input;
