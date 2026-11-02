import React from 'react';

export default function Card({
  children,
  interactive = false,
  className = '',
  onClick,
  ...props
}) {
  return (
    <div
      className={`ui-card ${interactive ? 'is-interactive' : ''} ${className}`.trim()}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
}
