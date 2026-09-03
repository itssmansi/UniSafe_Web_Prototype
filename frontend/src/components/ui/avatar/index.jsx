import React from 'react';

export function Avatar({ className, children }) {
  return (
    <div className={`relative flex shrink-0 overflow-hidden rounded-full ${className || ''}`}>
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt, className }) {
  if (!src) return null;
  return <img src={src} alt={alt || "Avatar"} className={`aspect-square h-full w-full object-cover rounded-full ${className || ''}`} />;
}

export function AvatarFallback({ children, className }) {
  return (
    <div className={`flex h-full w-full items-center justify-center rounded-full bg-[#2a2a2e] text-neutral-300 text-[10px] font-medium uppercase ${className || ''}`}>
      {children}
    </div>
  );
}
