import React from 'react';

export default function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div
      className={`ui-skeleton ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius: borderRadius || undefined,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}
