import React, { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea(
  {
    id,
    label,
    error,
    hint,
    className = '',
    required = false,
    disabled = false,
    maxLength,
    value,
    ...props
  },
  ref
) {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const errorId = textareaId && error ? `${textareaId}-error` : undefined;
  const hintId = textareaId && hint ? `${textareaId}-hint` : undefined;

  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="ui-field-wrap">
      {label && (
        <label className="ui-field-label" htmlFor={textareaId}>
          <span>
            {label}
            {required && <span style={{ color: 'var(--danger)', marginLeft: '0.2rem' }}>*</span>}
          </span>
          {maxLength && (
            <span className="ui-field-hint">
              {currentLength}/{maxLength}
            </span>
          )}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={`ui-textarea ${error ? 'has-error' : ''} ${className}`.trim()}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
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

export default Textarea;
