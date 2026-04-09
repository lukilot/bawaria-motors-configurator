'use client';

import { cn } from '@/lib/utils';
import { Phone, Mail, User } from 'lucide-react';

interface SalesRepresentativeCardProps {
    isDark?: boolean;
}

export function SalesRepresentativeCard({ isDark = false }: SalesRepresentativeCardProps) {
    return (
        <div className={cn(
            "p-5 rounded-2xl border transition-all duration-300",
            isDark 
                ? "bg-white/5 border-white/10" 
                : "bg-white border-black/5 shadow-sm hover:shadow-md"
        )}>
            <div className="flex items-start gap-4">
                {/* Profile Placeholder */}
                <div className={cn(
                    "w-12 h-12 rounded-full flex flex-shrink-0 items-center justify-center border",
                    isDark ? "bg-white/10 border-white/20 text-white" : "bg-gray-50 border-gray-100 text-gray-500"
                )}>
                    <User className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <h4 className={cn(
                        "text-[9px] uppercase tracking-[0.2em] font-black mb-1 opacity-50",
                        isDark ? "text-white" : "text-black"
                    )}>
                        Opiekun Oferty
                    </h4>
                    <p className={cn(
                        "text-sm font-bold tracking-tight mb-2 truncate",
                        isDark ? "text-white" : "text-gray-900"
                    )}>
                        Łukasz Lotoszyński
                    </p>
                    
                    <div className="flex flex-col gap-1.5 mt-3">
                        <a 
                            href="tel:+48508020612" 
                            className={cn(
                                "flex items-center gap-2 text-[11px] font-medium transition-colors w-fit",
                                isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"
                            )}
                        >
                            <Phone className="w-3 h-3" />
                            +48 508 020 612
                        </a>
                        <a 
                            href="mailto:lotoszynski_l@bmw-bawariamotors.pl" 
                            className={cn(
                                "flex items-center gap-2 text-[11px] font-medium transition-colors w-fit truncate max-w-full",
                                isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"
                            )}
                        >
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">lotoszynski_l@bmw-bawariamotors.pl</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
