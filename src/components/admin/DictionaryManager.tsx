'use client';

import { useState } from 'react';
import { DictionaryEditor } from './DictionaryEditor';
import { ModelUploader } from './ModelUploader';
import { Palette, Car, Layers, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';

type Section = 'models' | 'colors' | 'upholstery' | 'options';

export function DictionaryManager() {
    const [activeSection, setActiveSection] = useState<Section>('models');
    const [refreshKey, setRefreshKey] = useState(0);

    const sections = [
        { id: 'models', label: 'Models', icon: Car, type: 'model' as const },
        { id: 'colors', label: 'Colors', icon: Palette, type: 'color' as const },
        { id: 'upholstery', label: 'Upholstery', icon: Layers, type: 'upholstery' as const },
        { id: 'options', label: 'Options & Packages', icon: Tags, type: 'option' as const },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-8 mb-8 border-b border-gray-100">
                {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id as Section)}
                            className={cn(
                                "flex items-center gap-2 py-4 px-2 border-b-2 transition-all relative text-sm font-medium",
                                isActive
                                    ? "border-black text-black"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", isActive ? "text-black" : "text-gray-600")} />
                            {section.label}
                        </button>
                    );
                })}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeSection === 'models' && (
                    <>
                        <ModelUploader onComplete={() => setRefreshKey(k => k + 1)} />
                        <DictionaryEditor key={`model-${refreshKey}`} type="model" title="Model Dictionary" />
                    </>
                )}
                {activeSection === 'colors' && (
                    <DictionaryEditor type="color" title="Color Dictionary" />
                )}
                {activeSection === 'upholstery' && (
                    <DictionaryEditor type="upholstery" title="Upholstery Dictionary" />
                )}
                {activeSection === 'options' && (
                    <DictionaryEditor type="option" title="Options & Packages Dictionary" />
                )}
            </div>

            <p className="mt-6 text-xs text-gray-500 italic">
                * These mappings are used to translate technical codes (e.g. 475) to human-readable names (e.g. Sapphire Black) across the application.
            </p>
        </div>
    );
}
