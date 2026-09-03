import React from 'react';
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-md backdrop-blur-sm transition-all", className)} {...props} />
  );
}
