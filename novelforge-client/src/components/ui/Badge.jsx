import React from 'react';

/**
 * Standard badge component
 * @param {'primary' | 'success' | 'warning' | 'danger' | 'neutral'} variant
 */
export default function Badge({
  children,
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <span className={`ui-badge ui-badge-${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
