import React from 'react';

/**
 * Shared Button component
 * @param {'primary' | 'secondary' | 'quiet' | 'outline' | 'danger'} variant
 * @param {'sm' | 'md' | 'lg'} size
 * @param {boolean} loading
 * @param {React.ReactNode} icon
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  className = '',
  type = 'button',
  ...props
}) {
  const classNames = [
    'ui-btn',
    `ui-btn-${variant}`,
    size !== 'md' ? `ui-btn-${size}` : '',
    loading ? 'is-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <React.Fragment>
          <span className="spinner-sm" aria-hidden="true" />
          <span>{children}</span>
        </React.Fragment>
      ) : (
        <React.Fragment>
          {icon && <span className="ui-btn-icon" aria-hidden="true">{icon}</span>}
          <span>{children}</span>
        </React.Fragment>
      )}
    </button>
  );
}
