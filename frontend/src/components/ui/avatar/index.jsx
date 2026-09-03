import React from 'react';

export function Avatar({ className, children }) {
  return (
    <div className={`relative flex shrink-0 overflow-hidden rounded-full ${className || ''}`}>
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt }) {
  if (!src) return null;
  return <img src={src} alt={alt || "Avatar"} className="aspect-square h-full w-full object-cover" />;
}

export function AvatarFallback({ children }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-800 text-[10px] font-medium uppercase">
      {children}
    </div>
  );
}
