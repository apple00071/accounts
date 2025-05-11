import React from 'react';

export default function Logo({ className = "h-8 w-8" }) {
  return (
    <div className={`flex items-center justify-center rounded-full bg-primary-600 text-white ${className}`}>
      <svg 
        width="65%" 
        height="65%" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19 5h-2V3c0-.55-.45-1-1-1s-1 .45-1 1v2H9V3c0-.55-.45-1-1-1s-1 .45-1 1v2H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-7 10H7v-5h5v5zm5-5v5h-4v-5h4z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
} 