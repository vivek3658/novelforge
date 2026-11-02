import React from 'react';

/**
 * Accessible Icon-only Button with minimum 44px touch target
 */
export default function IconButton({
  icon,
  label,
  className = '',
  type = 'button',
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      className={`ui-icon-btn ${className}`.trim()}
      aria-label={label}
      title={label}
      disabled={disabled}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}
