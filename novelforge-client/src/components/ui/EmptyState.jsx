import React from 'react';

export default function EmptyState({
  icon = '📚',
  title = 'No items found',
  description,
  action,
  secondaryAction,
  className = '',
  ...props
}) {
  return (
    <div className={`ui-empty-state ${className}`.trim()} role="status" {...props}>
      {icon && <div className="ui-empty-icon" aria-hidden="true">{icon}</div>}
      {title && <h3 className="ui-empty-title">{title}</h3>}
      {description && <p className="ui-empty-description">{description}</p>}
      {(action || secondaryAction) && (
        <div className="ui-empty-actions">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
