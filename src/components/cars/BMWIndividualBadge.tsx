import { cn } from "@/lib/utils";
import { Diamond } from "lucide-react";

interface BMWIndividualBadgeProps {
    colorName?: string | null;
    className?: string;
    compact?: boolean;
}

export function BMWIndividualBadge({ colorName, className, compact }: BMWIndividualBadgeProps) {
    const displayName = colorName || "Wymaga weryfikacji";

    if (compact) {
        return (
            <span className={cn(
                "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase truncate px-2 py-1 rounded-sm bg-[#121212] tracking-widest text-[#d4af37] border border-[#d4af37]/40 shadow-sm",
                className
            )} title={`BMW Individual: ${displayName}`}>
                <Diamond className="w-2.5 h-2.5 fill-[#d4af37] text-[#d4af37] shrink-0" />
                <span className="truncate">{displayName}</span>
            </span>
        );
    }

    return (
        <div className={cn(
            "inline-flex flex-col gap-1.5 px-4 py-2 rounded-sm border shadow-lg bg-[#121212] border-[#d4af37]/40",
            className
        )}>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#d4af37] flex items-center gap-1.5">
                <Diamond className="w-3 h-3 fill-[#d4af37] text-[#d4af37] shrink-0" />
                BMW Individual
            </span>
            <span className="text-sm font-medium tracking-wider text-white truncate max-w-full">
                {displayName}
            </span>
        </div>
    );
}
