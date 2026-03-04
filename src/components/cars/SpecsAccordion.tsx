'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpecsAccordionProps {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
    className?: string;
    titleClassName?: string;
}

export function SpecsAccordion({ title, defaultOpen = false, children, className, titleClassName }: SpecsAccordionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={cn("border-b border-gray-100 last:border-0 transition-opacity", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full py-7 group text-left px-2 rounded-2xl hover:bg-black/[0.01] transition-all"
            >
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 transition-all",
                    isOpen ? "opacity-100" : "opacity-40",
                    titleClassName
                )}>
                    {title}
                </span>
                <div className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full border border-black/[0.03] bg-black/[0.01] transition-all duration-300",
                    isOpen && "rotate-180 bg-black text-white border-black"
                )}>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </button>

            <div
                className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100 mb-6" : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
}
