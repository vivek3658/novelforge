import React from 'react';
import Button from './Button';

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <nav className={`ui-pagination ${className}`.trim()} aria-label="Pagination">
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage <= 0}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ← Previous
      </Button>
      <span className="ui-pagination-info">
        Page {currentPage + 1} of {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage + 1 >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next →
      </Button>
    </nav>
  );
}
