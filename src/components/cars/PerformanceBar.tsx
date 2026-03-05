'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PerformanceBarProps {
    label: string;
    value: string;
    numericValue: number;
    maxValue: number;
    isDark?: boolean;
    isElectric?: boolean;
    delay?: number;
}

export function PerformanceBar({ label, value, numericValue, maxValue, isDark, isElectric, delay = 0 }: PerformanceBarProps) {
    // Calculate percentage (clamped between 0 and 100)
    const percentage = Math.min(Math.max((numericValue / maxValue) * 100, 0), 100);

    // Styling based on series
    const bgTrack = isDark ? "bg-white/5" : "bg-black/5";

    let fillGradient = "bg-gray-900";
    if (isDark) {
        fillGradient = "bg-gradient-to-r from-[#53A0DE] via-[#02256E] to-[#E40424]";
    } else if (isElectric) {
        fillGradient = "bg-gradient-to-r from-[#0653B6] to-[#2E95D3]";
    }

    return (
        <div className="flex flex-col gap-2 py-3">
            <div className="flex justify-between items-end">
                <span className={cn("text-xs font-medium", isDark ? "text-gray-400" : "text-gray-600")}>{label}</span>
                <span className={cn("text-sm font-bold", isDark ? "text-white" : (isElectric ? "text-[#0653B6]" : "text-black"))}>{value}</span>
            </div>
            <div className={cn("h-1.5 w-full rounded-full overflow-hidden", bgTrack)}>
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: delay, ease: [0.22, 1, 0.36, 1] }}
                    className={cn("h-full rounded-full", fillGradient)}
                />
            </div>
        </div>
    );
}
