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
        <div className={cn("border-b border-gray-100 last:border-0", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full py-6 group text-left"
            >
                <span className={cn("text-lg font-light text-gray-900 group-hover:text-black transition-colors", titleClassName)}>
                    {title}
                </span>
                <ChevronDown
                    className={cn(
                        "w-5 h-5 text-gray-400 transition-transform duration-300",
                        isOpen && "rotate-180 text-black"
                    )}
                />
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
