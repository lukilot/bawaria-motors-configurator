import { NeueKlasseGrille } from '@/components/animations/NeueKlasseGrille';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-500">
            <NeueKlasseGrille className="w-full max-w-lg px-8" isDark={true} />
            
            <div className="mt-12 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] text-white/50 uppercase tracking-[0.4em] font-bold">
                    Przygotowuję auto...
                </span>
            </div>
        </div>
    );
}
