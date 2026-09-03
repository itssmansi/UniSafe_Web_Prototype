import React from 'react';
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border border-[#262628] bg-[#141415] text-white shadow-sm transition-all", className)} {...props} />
  );
}
