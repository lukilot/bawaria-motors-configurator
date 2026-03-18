'use client';

import { cn } from '@/lib/utils';
import { getPluralForm } from '@/lib/plurals';
import { CheckCircle2, Truck } from 'lucide-react';

interface GroupAvailabilityProps {
    totalAvailable: number;
    inProduction: number;
    isDark?: boolean;
}

export function GroupAvailability({ totalAvailable, inProduction, isDark }: GroupAvailabilityProps) {
    if (totalAvailable === 0 && inProduction === 0) {
        return (
            <div className={cn(
                "p-4 rounded-2xl border flex items-center gap-3",
                isDark ? "bg-white/5 border-white/10 text-red-400" : "bg-red-50/50 border-red-100 text-red-600"
            )}>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-bold uppercase tracking-widest">Niedostępny</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <h4 className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", isDark ? "text-gray-400" : "text-gray-500")}>Dostępność w tej konfiguracji</h4>
            <div className="flex flex-col gap-2">
                {totalAvailable > 0 && (
                    <div className={cn(
                        "p-4 rounded-2xl border flex items-center justify-between transition-colors",
                        isDark ? "bg-white/5 border-white/10" : "bg-white border-black/5"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                            <span className={cn("text-sm font-bold", isDark ? "text-gray-200" : "text-gray-900")}>
                                Od ręki
                            </span>
                        </div>
                        <span className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-gray-400" : "text-gray-500")}>
                            {totalAvailable} {getPluralForm(totalAvailable, 'sztuka', 'sztuki', 'sztuk')}
                        </span>
                    </div>
                )}
                
                {inProduction > 0 && (
                    <div className={cn(
                        "p-4 rounded-2xl border flex items-center justify-between transition-colors",
                        isDark ? "bg-white/5 border-white/10" : "bg-white border-black/5"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Truck className="w-4 h-4 text-blue-500" />
                            </div>
                            <span className={cn("text-sm font-bold", isDark ? "text-gray-200" : "text-gray-900")}>
                                W produkcji
                            </span>
                        </div>
                        <span className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-gray-400" : "text-gray-500")}>
                            {inProduction} {getPluralForm(inProduction, 'sztuka', 'sztuki', 'sztuk')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
