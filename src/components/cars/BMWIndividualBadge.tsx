'use client';

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BMWIndividualBadgeProps {
    colorName?: string | null;
    className?: string;
    compact?: boolean;
}

export function BMWIndividualBadge({ colorName, className, compact }: BMWIndividualBadgeProps) {
    const displayName = colorName || "Individual Paint";

    // Refraction animation (Prism sweep)
    const refractionVariants = {
        animate: {
            x: ['-150%', '250%'],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut" as any,
                repeatDelay: 2
            }
        }
    };

    if (compact) {
        return (
            <span className={cn("inline-flex items-center gap-1.5", className)}>
                <span className="px-1.5 py-[3px] rounded-[3px] border border-current/[0.25] bg-current/[0.03] text-[7px] leading-none tracking-[0.15em] font-bold opacity-80 shrink-0">
                    INDIVIDUAL
                </span>
                <span className="break-words leading-tight">{displayName}</span>
            </span>
        );
    }

    return (
        <div className={cn(
            "relative inline-flex flex-col gap-1 px-6 py-4 rounded-sm overflow-hidden",
            "bg-white/40 backdrop-blur-xl border border-black/[0.03] shadow-[0_8px_32px_-4px_rgba(0,0,0,0.04)]",
            "group transition-all duration-700 hover:shadow-[0_20px_48px_-8px_rgba(0,0,0,0.08)]",
            className
        )}>
            {/* Soft Metallic Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/[0.02] pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
                <div className="flex gap-0.5">
                    <div className="w-1 h-3 bg-gray-900" />
                    <div className="w-1 h-3 bg-gray-400" />
                    <div className="w-1 h-3 bg-gray-200" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-900/60 transition-colors group-hover:text-gray-900">
                    BMW Individual
                </span>
            </div>

            <span className="text-base font-light tracking-wide text-gray-900 relative z-10 mt-1">
                {displayName}
            </span>

            {/* Prism Refraction Effect */}
            <motion.div
                variants={refractionVariants}
                animate="animate"
                className="absolute inset-y-0 w-32 rotate-[-25deg] pointer-events-none z-20"
                style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.03) 30%, rgba(168,85,247,0.03) 50%, rgba(59,130,246,0.03) 70%, transparent 100%)",
                    left: "-50%"
                }}
            />

            {/* Micro Highlight Line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-black/5 to-transparent" />
        </div>
    );
}
