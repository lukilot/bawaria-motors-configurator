'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface VinSelectorProps {
    currentVin: string;
    siblings: { vin: string; status_code: number }[];
    isDark?: boolean;
}

export function VinSelector({ currentVin, siblings, isDark }: VinSelectorProps) {
    const router = useRouter();
    const totalAvailable = siblings.length + 1;

    if (totalAvailable <= 1) {
        return (
            <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Numer VIN</span>
                <span className={cn(
                    "text-[12px] font-mono font-bold tracking-widest",
                    isDark ? "text-white" : "text-black"
                )}>
                    {currentVin}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Wybierz egzemplarz ({totalAvailable} szt.)</span>
            <div className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300",
                isDark
                    ? "bg-white/5 border-white/10 hover:border-white/20"
                    : "bg-black/[0.02] border-black/5 hover:border-black/10"
            )}>
                <select
                    value={currentVin}
                    onChange={(e) => router.push(`/cars/${e.target.value}`)}
                    className={cn(
                        "w-full text-[12px] font-mono font-bold bg-transparent border-none outline-none cursor-pointer appearance-none",
                        isDark ? "text-white" : "text-black"
                    )}
                >
                    <option value={currentVin} className="text-black">{currentVin} (Obecny)</option>
                    {siblings.filter(s => s.vin !== currentVin).map(s => (
                        <option key={s.vin} value={s.vin} className="text-black">
                            {s.vin} {s.status_code > 190 ? '✅' : '⏳'}
                        </option>
                    ))}
                </select>
                <ChevronDown className={cn("w-4 h-4 shrink-0 opacity-40", isDark ? "text-white" : "text-black")} />
            </div>
        </div>
    );
}
