import React, { forwardRef } from 'react';

const Select = forwardRef(function Select(
  {
    id,
    label,
    options,
    children,
    error,
    hint,
    className = '',
    required = false,
    disabled = false,
    ...props
  },
  ref
) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const errorId = selectId && error ? `${selectId}-error` : undefined;
  const hintId = selectId && hint ? `${selectId}-hint` : undefined;

  return (
    <div className="ui-field-wrap">
      {label && (
        <label className="ui-field-label" htmlFor={selectId}>
          <span>
            {label}
            {required && <span style={{ color: 'var(--danger)', marginLeft: '0.2rem' }}>*</span>}
          </span>
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`ui-select ${error ? 'has-error' : ''} ${className}`.trim()}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
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

export default Select;
