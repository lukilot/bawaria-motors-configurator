import { cn } from '@/lib/utils';
import React from 'react';

export interface OptionItem {
    code: string;
    name?: string;
    image?: string;
}

export interface OptionGroup {
    type: 'package' | 'standard';
    code: string;
    name?: string;
    image?: string;
    children: OptionItem[];
}

interface OptionsListProps {
    optionGroups: OptionGroup[];
    optionCodesCount: number;
    isDark?: boolean;
}

export function OptionsList({ optionGroups, optionCodesCount, isDark = false }: OptionsListProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h3 className={cn("text-2xl font-light", isDark ? "text-white" : "text-gray-900")}>Wyposażenie</h3>
                <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>{optionCodesCount} opcji</span>
            </div>

            <div className="space-y-12">
                {/* Packages Section */}
                {optionGroups.filter(g => g.type === 'package').length > 0 && (
                    <div className="space-y-8">
                        {optionGroups.filter(g => g.type === 'package').map((group, i) => (
                            <div key={i}>
                                <div className={cn("flex items-baseline justify-between border-b pb-4 mb-6", isDark ? "border-gray-800" : "border-gray-200")}>
                                    <div className="flex items-center gap-3">
                                        <h4 className={cn("text-lg font-bold uppercase tracking-wide", isDark ? "text-white" : "text-gray-900")}>
                                            {group.name || `Pakiet ${group.code}`}
                                        </h4>
                                        <span className={cn("text-xs px-2 py-1 rounded-sm font-mono", isDark ? "bg-[#1a1a1a] text-gray-400" : "bg-gray-100 text-gray-500")}>
                                            {group.code}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {group.children.map((child, j) => (
                                        <div key={j} className={cn(
                                            "flex items-center gap-4 p-4 shadow-sm rounded-sm transition-colors group",
                                            isDark
                                                ? "bg-[#1a1a1a] border border-gray-800 hover:border-gray-600"
                                                : "bg-white border border-gray-100 hover:border-gray-300"
                                        )}>
                                            {/* Thumbnail Placeholder */}
                                            <div className={cn(
                                                "w-24 h-16 rounded-sm flex-shrink-0 flex items-center justify-center overflow-hidden",
                                                isDark ? "bg-[#0f0f0f]" : "bg-white"
                                            )}>
                                                <img
                                                    src={child.image || `https://placehold.co/100x60/f3f4f6/a3a3a3?text=${child.code}`}
                                                    alt={child.code}
                                                    className={cn(
                                                        "w-full h-full object-contain p-1",
                                                        !child.image && "opacity-50 mix-blend-multiply object-cover p-0",
                                                        isDark && !child.image && "invert opacity-30"
                                                    )}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col">
                                                    <span className={cn("font-bold truncate", isDark ? "text-gray-200" : "text-gray-900")}>
                                                        {child.name || 'Opcja nieznana'}
                                                    </span>
                                                    <span className={cn("text-sm font-mono mt-1", isDark ? "text-gray-500" : "text-gray-400")}>
                                                        {child.code}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Standard Options Section */}
                <div>
                    <h4 className={cn("text-lg font-bold uppercase tracking-wide border-b pb-4 mb-6", isDark ? "text-white border-gray-800" : "text-gray-900 border-gray-200")}>
                        Opcje standardowe
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                        {optionGroups.filter(g => g.type === 'standard').length > 0 ? (
                            optionGroups.filter(g => g.type === 'standard').map((group, i) => (
                                <div key={i} className={cn(
                                    "flex items-center gap-4 p-4 shadow-sm rounded-sm transition-colors group",
                                    isDark
                                        ? "bg-[#1a1a1a] border border-gray-800 hover:border-gray-600"
                                        : "bg-white border border-gray-100 hover:border-gray-300"
                                )}>
                                    {/* Thumbnail Placeholder */}
                                    <div className={cn(
                                        "w-24 h-16 rounded-sm flex-shrink-0 flex items-center justify-center overflow-hidden",
                                        isDark ? "bg-[#0f0f0f]" : "bg-white"
                                    )}>
                                        <img
                                            src={group.image || `https://placehold.co/100x60/f3f4f6/a3a3a3?text=${group.code}`}
                                            alt={group.code}
                                            className={cn(
                                                "w-full h-full object-cover",
                                                !group.image && "opacity-50 mix-blend-multiply",
                                                isDark && !group.image && "invert opacity-30"
                                            )}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col">
                                            <span className={cn("font-bold truncate", isDark ? "text-gray-200" : "text-gray-900")}>
                                                {group.name || 'Opcja standardowa'}
                                            </span>
                                            <span className={cn("text-sm font-mono mt-1", isDark ? "text-gray-500" : "text-gray-400")}>
                                                {group.code}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-sm italic">Wszystkie opcje zawarte w pakietach.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
