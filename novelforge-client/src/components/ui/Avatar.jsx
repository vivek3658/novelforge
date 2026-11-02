import React from 'react';

/**
 * Standard Avatar with image or initial fallback
 * @param {'sm' | 'md' | 'lg' | 'xl'} size
 */
export default function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
  ...props
}) {
  const initial = (name || alt || 'U').trim().slice(0, 1).toUpperCase();

  return (
    <div
      className={`ui-avatar ui-avatar-${size} ${className}`.trim()}
      aria-label={alt || name || 'User avatar'}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
