import React from 'react';

export const MinaretIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2v2" />
    <path d="M9 4l3-2 3 2" />
    <path d="M10 4v4h4V4" />
    <path d="M9 8h6l1 3H8l1-3z" />
    <path d="M10 11v11h4V11" />
    <path d="M7 22h10" />
    <path d="M11 14h2v2h-2z" />
  </svg>
);
