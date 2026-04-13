import React from 'react';

export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* The Apex Emblem */}
      <path d="M20 6 L6 34H13L20 20L27 34H34L20 6Z" fill="currentColor"/>
      <path d="M20 20 L27 34H34L20 6V20Z" fill="currentColor" fillOpacity="0.3"/>
      
      {/* APX Text */}
      <text x="44" y="24" fontFamily="sans-serif" fontWeight="900" fontSize="20" letterSpacing="0.1em" fill="currentColor">APX</text>
      
      {/* DEALER Text */}
      <text x="46" y="34" fontFamily="sans-serif" fontWeight="500" fontSize="8" letterSpacing="0.35em" fill="currentColor" opacity="0.6">DEALER</text>
    </svg>
  );
}
