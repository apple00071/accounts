import React from 'react';

export default function Card({ 
  children, 
  className = '', 
  noPadding = false,
  as: Component = 'div'
}) {
  return (
    <Component
      className={`
        bg-white 
        rounded-lg 
        shadow-sm 
        border 
        border-gray-100 
        ${!noPadding ? 'p-4' : ''} 
        hover:shadow-md 
        transition-shadow
        ${className}
      `.trim()}
    >
      {children}
    </Component>
  );
} 