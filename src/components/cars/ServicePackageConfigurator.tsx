'use client';

import { useState, useEffect } from 'react';
import { ServicePackage, getServicePackages, getServicePrices } from '@/lib/service-packages';
import { cn } from '@/lib/utils';
import { Shield, Wrench, X, Loader2 } from 'lucide-react';

interface ServicePackageConfiguratorProps {
    currentCodes: string[];
    seriesCode: string; // e.g. G60
    fuelType?: string; // e.g. 'Electric', 'Diesel'
    onPriceUpdate: (additionalCost: number) => void;
    onSelectionChange: (codes: string[]) => void;
    isDark?: boolean;
}

export function ServicePackageConfigurator({
    currentCodes,
    seriesCode,
    fuelType,
    onPriceUpdate,
    onSelectionChange,
    isDark = false
}: ServicePackageConfiguratorProps) {
    const [packages, setPackages] = useState<ServicePackage[]>([]);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Selected states (package codes)
    const [selectedBri, setSelectedBri] = useState<string | null>(null);
    const [selectedBsi, setSelectedBsi] = useState<string | null>(null);

    // Modal states
    const [isBriModalOpen, setIsBriModalOpen] = useState(false);
    const [isBsiModalOpen, setIsBsiModalOpen] = useState(false);

    // Initial loaded state to prevent override loops
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const [pkgData, priceData] = await Promise.all([
                getServicePackages(),
                getServicePrices(seriesCode)
            ]);
            setPackages(pkgData.filter(p => {
                // Filter by vehicle_type
                const vType: string = (p as any).vehicle_type || 'ALL';
                if (vType === 'ALL') return true;

                const isElectric = fuelType?.toUpperCase() === 'ELECTRIC' || fuelType?.toUpperCase() === 'ELEKTRYCZNY';

                if (vType === 'ELECTRIC') return isElectric;
                if (vType === 'ICE_PHEV') return !isElectric;

                return true;
            }));
            setPrices(priceData);
            setIsLoading(false);
        };
        loadData();
    }, [seriesCode, fuelType]);

    // Initialize selection based on currentCodes
    useEffect(() => {
        if (packages.length > 0 && !isInitialized) {
            // Find current BRI
            const currentBri = packages.find(p => p.type === 'BRI' && currentCodes.includes(p.code));
            if (currentBri) setSelectedBri(currentBri.code);

            // Find current BSI
            const currentBsi = packages.find(p => (p.type === 'BSI' || p.type === 'BSI_PLUS') && currentCodes.includes(p.code));
            if (currentBsi) setSelectedBsi(currentBsi.code);

            setIsInitialized(true);
        }
    }, [packages, currentCodes, isInitialized]);

    // Calculate costs and notify parent
    useEffect(() => {
        if (!isInitialized) return;

        let totalAdditionalCost = 0;
        const selectedCodes: string[] = [];

        // BRI Logic
        const baseBri = packages.find(p => p.type === 'BRI' && currentCodes.includes(p.code));
        const baseBriPrice = baseBri ? (prices[baseBri.id] || 0) : 0;

        if (selectedBri) {
            selectedCodes.push(selectedBri);
            // If selected is different from base, add cost difference
            if (selectedBri !== baseBri?.code) {
                const selectedPkg = packages.find(p => p.code === selectedBri);
                const selectedPrice = selectedPkg ? (prices[selectedPkg.id] || 0) : 0;
                totalAdditionalCost += Math.max(0, selectedPrice - baseBriPrice);
            }
        }

        // BSI Logic
        const baseBsi = packages.find(p => (p.type === 'BSI' || p.type === 'BSI_PLUS') && currentCodes.includes(p.code));
        const baseBsiPrice = baseBsi ? (prices[baseBsi.id] || 0) : 0;

        if (selectedBsi) {
            selectedCodes.push(selectedBsi);
            if (selectedBsi !== baseBsi?.code) {
                const selectedPkg = packages.find(p => p.code === selectedBsi);
                const selectedPrice = selectedPkg ? (prices[selectedPkg.id] || 0) : 0;
                totalAdditionalCost += Math.max(0, selectedPrice - baseBsiPrice);
            }
        }

        onPriceUpdate(totalAdditionalCost);
        onSelectionChange(selectedCodes);

    }, [selectedBri, selectedBsi, prices, packages, isInitialized, currentCodes, onPriceUpdate, onSelectionChange]);


    if (isLoading) return <div className="py-8 text-center text-gray-300"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;

    // Derived Data
    const baseBri = packages.find(p => p.type === 'BRI' && currentCodes.includes(p.code));
    const baseBriPrice = baseBri ? (prices[baseBri.id] || 0) : 0;

    const baseBsi = packages.find(p => (p.type === 'BSI' || p.type === 'BSI_PLUS') && currentCodes.includes(p.code));
    const baseBsiPrice = baseBsi ? (prices[baseBsi.id] || 0) : 0;

    const briPackages = packages.filter(p => p.type === 'BRI');
    const bsiPackages = packages.filter(p => p.type === 'BSI').sort((a, b) => a.duration_months - b.duration_months || a.mileage_limit - b.mileage_limit);
    const bsiPlusPackages = packages.filter(p => p.type === 'BSI_PLUS').sort((a, b) => a.duration_months - b.duration_months || a.mileage_limit - b.mileage_limit);

    // Get current package objects for summary tiles
    const currentBriPkg = selectedBri ? packages.find(p => p.code === selectedBri) : null;
    const currentBsiPkg = selectedBsi ? packages.find(p => p.code === selectedBsi) : null;

    // Helper: Price String for Popup tiles
    const getTilePriceString = (targetPrice: number, currentPrice: number, isSelected: boolean) => {
        if (isSelected) return 'W cenie';

        const diff = targetPrice - currentPrice;

        if (diff === 0) return 'W cenie';
        if (diff > 0) return `+ ${diff.toLocaleString()} zł`;
        return `- ${Math.abs(diff).toLocaleString()} zł`;
    };

    // Helper: Summary Tile Text Logic
    const getSummaryText = (code: string | null, baseCode: string | undefined, baseP: number) => {
        const isBase = (code === baseCode) || (!code && !baseCode);

        if (isBase) return "Zmień pakiet";

        // Calculate diff
        const pkg = packages.find(p => p.code === code);
        const currentP = pkg ? (prices[pkg.id] || 0) : 0;

        const diff = currentP - baseP;

        if (diff > 0) return `+ ${diff.toLocaleString()} PLN`;
        return "Zmień pakiet";
    };

    const getSummaryTextColor = (code: string | null, baseCode: string | undefined) => {
        const isBase = (code === baseCode) || (!code && !baseCode);
        return isBase ? "text-gray-500 underline decoration-gray-300 underline-offset-2" : "text-green-600 font-bold";
    };

    // Helper Render Tile inside Modal (Compact-er)
    // Helper Render Tile inside Modal (Premium & Large)
    const renderCompactTile = (
        pkg: ServicePackage | null,
        currentSelection: string | null,
        basePkgCode: string | undefined,
        basePrice: number,
        onSelect: (code: string | null) => void
    ) => {
        const isStandard = pkg === null;
        const code = isStandard ? null : pkg.code;
        const price = isStandard ? 0 : (prices[pkg!.id] || 0);

        if (!isStandard && price === undefined && code !== basePkgCode) return null;

        const pkgPrice = price;
        const upgradeCost = pkgPrice - basePrice;

        const isSelected = currentSelection === code;

        // Calculate current selection price for diff
        const currentSelectionPkg = packages.find(p => p.code === currentSelection);
        const currentSelectionPrice = currentSelectionPkg ? (prices[currentSelectionPkg.id] || 0) : 0;

        // BSI Special: If it's BSI and factory is null, any pkg is an upgrade. 
        // If it's BRI, factory is usually 2y, so anything < 2y is a downgrade.
        const isBsi = !isStandard && (pkg.type === 'BSI' || pkg.type === 'BSI_PLUS');
        const isBsiNull = isStandard && (currentSelectionPkg?.type === 'BSI' || currentSelectionPkg?.type === 'BSI_PLUS' || !currentSelection);

        // Disable if it's strictly cheaper than factory (downgrade) and NOT factory itself.
        // Exceptions for BSI "None" if factory is None.
        const isCheaper = upgradeCost < 0;
        const isDisabled = isCheaper && !isStandard; // Allow selecting "None" (isStandard) always for BSI/BRI to see base

        // Content
        let years = 0;
        let km = 0;
        if (!isStandard && pkg) {
            years = pkg.duration_months / 12;
            km = pkg.mileage_limit / 1000;
        } else {
            years = 2; km = 0;
        }

        return (
            <div
                key={code || 'std'}
                onClick={() => !isDisabled && onSelect(code)}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                className={cn(
                    "relative group flex flex-col justify-between p-5 rounded-[1.5rem] border transition-all text-left h-32 w-[calc(50%-0.5rem)] sm:w-[calc(25%-0.75rem)] shrink-0 grow-0 select-none outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black",
                    isSelected
                        ? (isDark ? "bg-white text-black border-white shadow-2xl z-10" : "bg-black text-white border-black shadow-2xl z-10")
                        : isDisabled
                            ? "bg-black/5 border-white/5 opacity-20 cursor-not-allowed"
                            : (isDark
                                ? "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 cursor-pointer"
                                : "bg-white border-black/[0.05] hover:border-black/20 hover:bg-black/[0.02] cursor-pointer")
                )}
            >
                <div className="flex flex-col flex-1 pointer-events-none">
                    <span className={cn("text-lg font-black leading-none tracking-tight", isSelected ? "" : (isDark ? "text-white" : "text-black"))}>
                        {isStandard ? 'Brak' : years} <span className="text-[10px] font-bold uppercase tracking-widest ml-0.5 opacity-60">{isStandard ? 'pakietu' : (years >= 2 && years <= 4 ? 'lata' : 'lat')}</span>
                    </span>
                    <span className={cn("text-[10px] uppercase font-black tracking-widest mt-2 opacity-50", isSelected ? "" : (isDark ? "text-gray-400" : "text-gray-500"))}>
                        {isStandard ? 'Standard' : (km > 0 ? `${(pkg!.mileage_limit).toLocaleString('pl-PL')} km` : 'Standard')}
                    </span>
                </div>
                <div className={cn("w-full pt-4 border-t border-dashed pointer-events-none", isSelected ? "border-current/20" : "border-current/10")}>
                    <span className={cn("text-[11px] font-black uppercase tracking-widest block", isSelected ? "" : (isDark ? "text-white" : "text-black"))}>
                        {isStandard && basePrice === 0 ? 'W cenie' : (isDisabled ? 'N/D' : getTilePriceString(pkgPrice, currentSelectionPrice, isSelected))}
                    </span>
                </div>
                {/* Horizontal Indicator Line */}
                <div className={cn("absolute top-0 left-6 right-6 h-1 rounded-b-full",
                    isStandard ? "bg-gray-400" : (pkg?.type === 'BRI' ? "bg-orange-500" : pkg?.plus ? "bg-purple-500" : "bg-blue-500")
                )} />
            </div>
        );
    };

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 pt-4")}>
            {/* BRI Summary Tile */}
            <button
                onClick={() => setIsBriModalOpen(true)}
                className={cn(
                    "group flex items-center gap-5 p-5 rounded-[2rem] border transition-all w-full text-left hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
                    isDark
                        ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-orange-500/30 shadow-2xl shadow-black/20"
                        : "bg-white border-black/[0.03] hover:border-orange-500/30 shadow-xl shadow-black/[0.02]"
                )}
            >
                <div className={cn(
                    "w-16 h-16 shrink-0 rounded-[1.25rem] flex items-center justify-center border transition-all duration-500",
                    isDark
                        ? "bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/20 group-hover:border-orange-500/40"
                        : "bg-orange-50 border-orange-100 group-hover:bg-orange-100 group-hover:border-orange-200"
                )}>
                    <Shield className={cn("w-7 h-7 transition-transform duration-500 group-hover:scale-110", "text-orange-500")} />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-500 mb-1.5 opacity-60">Pakiet Naprawczy</span>
                    <span className={cn("text-[13px] font-black uppercase tracking-tight", isDark ? "text-white" : "text-black")}>
                        {currentBriPkg
                            ? `${(currentBriPkg.duration_months / 12)} ${(currentBriPkg.duration_months / 12) >= 2 && (currentBriPkg.duration_months / 12) <= 4 ? 'lata' : 'lat'} / ${currentBriPkg.mileage_limit.toLocaleString('pl-PL')} km`
                            : 'Standard 2 lata'}
                    </span>
                    <div className={cn("flex items-center gap-2 mt-2", getSummaryTextColor(selectedBri, baseBri?.code))}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", (selectedBri === baseBri?.code || !selectedBri) ? "bg-gray-400" : "bg-green-500 animate-pulse")} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {getSummaryText(selectedBri, baseBri?.code, baseBriPrice)}
                        </span>
                    </div>
                </div>
            </button>

            {/* BSI Summary Tile */}
            <button
                onClick={() => setIsBsiModalOpen(true)}
                className={cn(
                    "group flex items-center gap-5 p-5 rounded-[2rem] border transition-all w-full text-left hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
                    isDark
                        ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/30 shadow-2xl shadow-black/20"
                        : "bg-white border-black/[0.03] hover:border-blue-500/30 shadow-xl shadow-black/[0.02]"
                )}
            >
                <div className={cn(
                    "w-16 h-16 shrink-0 rounded-[1.25rem] flex items-center justify-center border transition-all duration-500",
                    isDark
                        ? "bg-blue-500/10 border-blue-500/20 group-hover:bg-blue-500/20 group-hover:border-blue-500/40"
                        : "bg-blue-50 border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200"
                )}>
                    <Wrench className={cn("w-7 h-7 transition-transform duration-500 group-hover:scale-110", "text-blue-500")} />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-500 mb-1.5 opacity-60">Pakiet Serwisowy</span>
                    <span className={cn("text-[13px] font-black uppercase tracking-tight", isDark ? "text-white" : "text-black")}>
                        {currentBsiPkg
                            ? `${currentBsiPkg.plus ? 'Plus ' : ''}${(currentBsiPkg.duration_months / 12)} ${(currentBsiPkg.duration_months / 12) >= 2 && (currentBsiPkg.duration_months / 12) <= 4 ? 'lata' : 'lat'} / ${currentBsiPkg.mileage_limit.toLocaleString('pl-PL')} km`
                            : 'Brak pakietu'}
                    </span>
                    <div className={cn("flex items-center gap-2 mt-2", getSummaryTextColor(selectedBsi, baseBsi?.code))}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", (selectedBsi === baseBsi?.code || !selectedBsi) ? "bg-gray-400" : "bg-green-500 animate-pulse")} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {getSummaryText(selectedBsi, baseBsi?.code, baseBsiPrice)}
                        </span>
                    </div>
                </div>
            </button>

            {/* Modals */}
            <Modal isOpen={isBriModalOpen} onClose={() => setIsBriModalOpen(false)} title="Przedłużona Gwarancja (BRI)" isDark={isDark}>
                <div className={cn(
                    "mb-8 p-4 rounded-2xl border text-[11px] font-bold uppercase tracking-widest leading-relaxed",
                    isDark ? "bg-orange-500/10 border-orange-500/20 text-orange-200" : "bg-orange-50 border-orange-100 text-orange-900"
                )}>
                    Obejmuje bezpłatne naprawy usterek mechanicznych i elektrycznych pojazdu po upływie gwarancji podstawowej.
                </div>
                <div className="flex flex-wrap gap-4 justify-start">
                    {renderCompactTile(null, selectedBri, baseBri?.code, baseBriPrice, (c) => { setSelectedBri(c); })}
                    {briPackages.map(pkg => renderCompactTile(pkg, selectedBri, baseBri?.code, baseBriPrice, (c) => { setSelectedBri(c); }))}
                </div>
            </Modal>

            <Modal isOpen={isBsiModalOpen} onClose={() => setIsBsiModalOpen(false)} title="Serwisowanie BMW (BSI)" isDark={isDark}>
                <div className="space-y-10">
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <h4 className={cn("text-xs font-black uppercase tracking-[0.3em]", isDark ? "text-blue-400" : "text-blue-600")}>Service Inclusive</h4>
                            <div className={cn("h-px flex-1", isDark ? "bg-white/10" : "bg-black/5")} />
                        </div>
                        <div className="flex flex-wrap gap-4 justify-start">
                            {/* Allow deselection/standard for BSI if base is also 0/null */}
                            {!baseBsi && renderCompactTile(null, selectedBsi, undefined, baseBsiPrice, (c) => { setSelectedBsi(c); })}
                            {bsiPackages.map(pkg => renderCompactTile(pkg, selectedBsi, baseBsi?.code, baseBsiPrice, (c) => { setSelectedBsi(c); }))}
                        </div>
                    </div>

                    {bsiPlusPackages.length > 0 && (
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <h4 className={cn("text-xs font-black uppercase tracking-[0.3em]", isDark ? "text-purple-400" : "text-purple-600")}>Service Inclusive Plus</h4>
                                <div className={cn("h-px flex-1", isDark ? "bg-white/10" : "bg-black/5")} />
                            </div>
                            <div className="flex flex-wrap gap-4 justify-start">
                                {bsiPlusPackages.map(pkg => renderCompactTile(pkg, selectedBsi, baseBsi?.code, baseBsiPrice, (c) => { setSelectedBsi(c); }))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

// Helper: Modal Wrapper
const Modal = ({ isOpen, onClose, title, children, isDark }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; isDark: boolean }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={cn(
                "relative my-auto shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden rounded-[2.5rem] border transition-all duration-700 animate-in fade-in zoom-in slide-in-from-bottom-5",
                isDark ? "bg-gray-900/90 border-white/10 backdrop-blur-xl" : "bg-white/95 border-black/[0.03] backdrop-blur-xl"
            )}>
                <div className={cn(
                    "flex justify-between items-center px-10 py-8 border-b shrink-0",
                    isDark ? "border-white/10 bg-white/5" : "border-black/[0.03] bg-black/[0.01]"
                )}>
                    <h3 className={cn("text-sm font-black uppercase tracking-[0.3em]", isDark ? "text-white" : "text-black")}>{title}</h3>
                    <button
                        onClick={onClose}
                        className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90",
                            isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-black"
                        )}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-10 overflow-y-auto w-full custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};
