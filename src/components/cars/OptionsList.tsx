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
}

export function OptionsList({ optionGroups, optionCodesCount }: OptionsListProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-light">Wyposażenie</h3>
                <span className="text-sm text-gray-400">{optionCodesCount} opcji</span>
            </div>

            <div className="space-y-12">
                {/* Packages Section */}
                {optionGroups.filter(g => g.type === 'package').length > 0 && (
                    <div className="space-y-8">
                        {optionGroups.filter(g => g.type === 'package').map((group, i) => (
                            <div key={i}>
                                <div className="flex items-baseline justify-between border-b border-gray-200 pb-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-lg font-bold uppercase tracking-wide">
                                            {group.name || `Pakiet ${group.code}`}
                                        </h4>
                                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-sm font-mono">
                                            {group.code}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {group.children.map((child, j) => (
                                        <div key={j} className="flex items-center gap-4 p-4 bg-white border border-gray-100 shadow-sm rounded-sm hover:border-gray-300 transition-colors group">
                                            {/* Thumbnail Placeholder */}
                                            <div className="w-24 h-16 bg-white rounded-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={child.image || `https://placehold.co/100x60/f3f4f6/a3a3a3?text=${child.code}`}
                                                    alt={child.code}
                                                    className={cn(
                                                        "w-full h-full object-contain p-1",
                                                        !child.image && "opacity-50 mix-blend-multiply object-cover p-0"
                                                    )}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 truncate">
                                                        {child.name || 'Opcja nieznana'}
                                                    </span>
                                                    <span className="text-sm text-gray-400 font-mono mt-1">
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
                    <h4 className="text-lg font-bold uppercase tracking-wide border-b border-gray-200 pb-4 mb-6">
                        Opcje standardowe
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                        {optionGroups.filter(g => g.type === 'standard').length > 0 ? (
                            optionGroups.filter(g => g.type === 'standard').map((group, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-white border border-gray-100 shadow-sm rounded-sm hover:border-gray-300 transition-colors group">
                                    {/* Thumbnail Placeholder */}
                                    <div className="w-24 h-16 bg-white rounded-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={group.image || `https://placehold.co/100x60/f3f4f6/a3a3a3?text=${group.code}`}
                                            alt={group.code}
                                            className={cn(
                                                "w-full h-full object-cover",
                                                !group.image && "opacity-50 mix-blend-multiply"
                                            )}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 truncate">
                                                {group.name || 'Opcja standardowa'}
                                            </span>
                                            <span className="text-sm text-gray-400 font-mono mt-1">
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
