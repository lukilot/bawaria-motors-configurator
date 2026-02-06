'use client';

import { useState, useEffect } from 'react';
import { ServicePackage, getServicePackages, getServicePrices } from '@/lib/service-packages';
import { cn } from '@/lib/utils';
import { Check, Loader2, Shield, Wrench, X, ChevronRight } from 'lucide-react';

interface ServicePackageConfiguratorProps {
    currentCodes: string[];
    seriesCode: string; // e.g. G60
    onPriceUpdate: (additionalCost: number) => void;
    onSelectionChange: (codes: string[]) => void;
}

export function ServicePackageConfigurator({
    currentCodes,
    seriesCode,
    onPriceUpdate,
    onSelectionChange
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
            setPackages(pkgData);
            setPrices(priceData);
            setIsLoading(false);
        };
        loadData();
    }, [seriesCode]);

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
        const baseBriPrice = baseBri ? (prices[baseBri.code] || 0) : 0;

        if (selectedBri) {
            selectedCodes.push(selectedBri);
            // If selected is different from base, add cost difference
            if (selectedBri !== baseBri?.code) {
                const selectedPrice = prices[selectedBri] || 0;
                totalAdditionalCost += Math.max(0, selectedPrice - baseBriPrice);
            }
        }

        // BSI Logic
        const baseBsi = packages.find(p => (p.type === 'BSI' || p.type === 'BSI_PLUS') && currentCodes.includes(p.code));
        const baseBsiPrice = baseBsi ? (prices[baseBsi.code] || 0) : 0;

        if (selectedBsi) {
            selectedCodes.push(selectedBsi);
            if (selectedBsi !== baseBsi?.code) {
                const selectedPrice = prices[selectedBsi] || 0;
                totalAdditionalCost += Math.max(0, selectedPrice - baseBsiPrice);
            }
        }

        onPriceUpdate(totalAdditionalCost);
        onSelectionChange(selectedCodes);

    }, [selectedBri, selectedBsi, prices, packages, isInitialized, currentCodes, onPriceUpdate, onSelectionChange]);


    if (isLoading) return <div className="py-8 text-center text-gray-300"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;
    // if (packages.length === 0) return null; // Keep showing even if empty? no.

    // Derived Data
    const baseBri = packages.find(p => p.type === 'BRI' && currentCodes.includes(p.code));
    const baseBriPrice = baseBri ? (prices[baseBri.code] || 0) : 0;
    const showStandardBri = !baseBri;

    const baseBsi = packages.find(p => (p.type === 'BSI' || p.type === 'BSI_PLUS') && currentCodes.includes(p.code));
    const baseBsiPrice = baseBsi ? (prices[baseBsi.code] || 0) : 0;
    const showStandardBsi = !baseBsi;

    const briPackages = packages.filter(p => p.type === 'BRI');
    const bsiPackages = packages.filter(p => p.type === 'BSI').sort((a, b) => a.duration_months - b.duration_months || a.mileage_limit - b.mileage_limit);
    const bsiPlusPackages = packages.filter(p => p.type === 'BSI_PLUS').sort((a, b) => a.duration_months - b.duration_months || a.mileage_limit - b.mileage_limit);

    // Get current package objects for summary tiles
    const currentBriPkg = selectedBri ? packages.find(p => p.code === selectedBri) : null;
    const currentBsiPkg = selectedBsi ? packages.find(p => p.code === selectedBsi) : null;

    // Helper: Price String for Popup tiles
    const getTilePriceString = (code: string | null, currentSelection: string | null) => {
        const currentP = currentSelection ? (prices[currentSelection] || 0) : 0;
        const targetP = code ? (prices[code] || 0) : 0;

        if (code === currentSelection) return 'W cenie';

        const diff = targetP - currentP;

        if (diff === 0) return 'W cenie';
        if (diff > 0) return `+ ${diff.toLocaleString()} zł`;
        return `- ${Math.abs(diff).toLocaleString()} zł`;
    };

    // Helper: Summary Tile Text Logic
    const getSummaryText = (code: string | null, baseCode: string | undefined, baseP: number) => {
        // If included (selected == base) -> "Zmień pakiet"
        // If upgrade -> Green Price
        const isBase = (code === baseCode) || (!code && !baseCode);

        if (isBase) return "Zmień pakiet";

        // Calculate diff
        const currentP = code ? (prices[code] || 0) : 0;
        const diff = currentP - baseP;

        if (diff > 0) return `+ ${diff.toLocaleString()} PLN`;
        // Should not happen if cheaper disabled, but just in case
        return "Zmień pakiet";
    };

    const getSummaryTextColor = (code: string | null, baseCode: string | undefined) => {
        const isBase = (code === baseCode) || (!code && !baseCode);
        return isBase ? "text-gray-500 underline decoration-gray-300 underline-offset-2" : "text-green-600 font-bold";
    };

    // Helper Render Tile inside Modal (Compact-er)
    const renderCompactTile = (
        pkg: ServicePackage | null,
        currentSelection: string | null,
        basePkgCode: string | undefined,
        basePrice: number,
        onSelect: (code: string | null) => void
    ) => {
        const isStandard = pkg === null;
        const code = isStandard ? null : pkg.code;
        const price = isStandard ? 0 : (prices[code!] || 0);

        if (!isStandard && price === undefined && code !== basePkgCode) return null;

        const pkgPrice = price;
        const upgradeCost = pkgPrice - basePrice;

        // Only disable if it's strictly cheaper (downgrade) and NOT the base.
        // If current car has base 7CH, and we compare to Standard (null), upgradeCost is negative. Disable.
        const isCheaper = upgradeCost < 0;
        const isDisabled = isCheaper;

        const isSelected = currentSelection === code;

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
                    "relative group flex flex-col justify-between p-1.5 rounded-sm border transition-all text-center h-20 w-[calc(25%-0.4rem)] shrink-0 grow-0 select-none outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black",
                    isSelected
                        ? "bg-black text-white border-black shadow-lg z-10"
                        : isDisabled
                            ? "bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed"
                            : "bg-white border-gray-200 hover:border-black hover:shadow-md cursor-pointer"
                )}
            >
                <div className="flex flex-col items-center justify-center flex-1 -mt-1 pointer-events-none">
                    <span className={cn("text-sm font-bold leading-none", isSelected ? "text-white" : "text-gray-900")}>
                        {years} <span className="text-[9px] font-normal uppercase">{(years >= 2 && years <= 4) ? 'lata' : 'lat'}</span>
                    </span>
                    <span className={cn("text-[9px] uppercase font-medium mt-0.5", isSelected ? "text-gray-300" : "text-gray-500")}>
                        {km > 0 ? `${(pkg!.mileage_limit).toLocaleString('de-DE')} km` : 'Bez limitu'}
                    </span>
                </div>
                <div className="w-full pt-1 border-t border-dashed border-gray-500/20 pointer-events-none">
                    <span className={cn("text-[9px] font-bold block", isSelected ? "text-white" : "text-black")}>
                        {isDisabled ? '' : getTilePriceString(code, currentSelection)}
                    </span>
                </div>
                <div className={cn("absolute top-0 left-0 w-full h-0.5 rounded-t-sm",
                    isStandard ? "bg-gray-400" : (pkg?.type === 'BRI' ? "bg-orange-500" : pkg?.plus ? "bg-purple-500" : "bg-blue-500")
                )} />

            </div>
        );
    };

    // Helper: Modal Wrapper
    const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

                <div className="absolute inset-0 bg-black/60" onClick={onClose} />
                <div className={cn("relative bg-white rounded-lg shadow-2xl w-fit max-w-[95vw] sm:max-w-4xl max-h-[95vh] flex flex-col p-0", maxWidth)}>
                    {/* Removed overflow-y-auto from main container, put it in content if needed, but we want NO scroll if possible. 
                       Actually user said "nie będzie potrzeba scrollowania". So auto is fine, but we aim to fit.
                       Removed p-6 to save space.
                   */}
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
                        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
                    </div>
                    <div className="p-4 overflow-y-auto w-full">
                        {children}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
                {/* BRI Summary Tile */}
                <button
                    onClick={() => setIsBriModalOpen(true)}
                    className="group flex flex-col xl:flex-row items-center xl:items-start gap-2 p-2 bg-white border border-gray-100 rounded-sm hover:border-black hover:shadow-sm transition-all w-full text-left"
                >
                    <div className="w-10 h-10 shrink-0 bg-orange-50 rounded-sm flex items-center justify-center border border-orange-100 group-hover:border-orange-200">
                        <Shield className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[9px] uppercase font-bold text-gray-400 mb-0.5 truncate w-full">Pakiet Naprawczy</span>
                        <span className="text-xs font-bold text-gray-900 group-hover:text-black truncate w-full">
                            {currentBriPkg ? `${(currentBriPkg.duration_months / 12)} ${(currentBriPkg.duration_months / 12) >= 2 && (currentBriPkg.duration_months / 12) <= 4 ? 'lata' : 'lat'} / ${currentBriPkg.mileage_limit.toLocaleString('de-DE')} km` : 'Standard 2 lata'}
                        </span>
                        <span className={cn("text-[10px] mt-0.5 truncate w-full", getSummaryTextColor(selectedBri, baseBri?.code))}>
                            {getSummaryText(selectedBri, baseBri?.code, baseBriPrice)}
                        </span>
                    </div>
                </button>

                {/* BSI Summary Tile */}
                <button
                    onClick={() => setIsBsiModalOpen(true)}
                    className="group flex flex-col xl:flex-row items-center xl:items-start gap-2 p-2 bg-white border border-gray-100 rounded-sm hover:border-black hover:shadow-sm transition-all w-full text-left"
                >
                    <div className="w-10 h-10 shrink-0 bg-blue-50 rounded-sm flex items-center justify-center border border-blue-100 group-hover:border-blue-200">
                        <Wrench className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[9px] uppercase font-bold text-gray-400 mb-0.5 truncate w-full">Pakiet Serwisowy</span>
                        <span className="text-xs font-bold text-gray-900 group-hover:text-black truncate w-full">
                            {currentBsiPkg
                                ? `${currentBsiPkg.plus ? 'Plus ' : ''}${(currentBsiPkg.duration_months / 12)} ${(currentBsiPkg.duration_months / 12) >= 2 && (currentBsiPkg.duration_months / 12) <= 4 ? 'lata' : 'lat'} / ${currentBsiPkg.mileage_limit.toLocaleString('de-DE')} km`
                                : 'Brak pakietu'}
                        </span>
                        <span className={cn("text-[10px] mt-0.5 truncate w-full", getSummaryTextColor(selectedBsi, baseBsi?.code))}>
                            {getSummaryText(selectedBsi, baseBsi?.code, baseBsiPrice)}
                        </span>
                    </div>
                </button>
            </div>

            {/* Modals */}
            <Modal isOpen={isBriModalOpen} onClose={() => setIsBriModalOpen(false)} title="Przedłużona Gwarancja (BRI)" maxWidth="max-w-3xl">
                <div className="mb-4 text-[10px] text-gray-500 bg-orange-50 p-2 rounded border border-orange-100">
                    Obejmuje naprawy usterek mechanicznych i elektrycznych po upływie fabrycznej gwarancji.
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                    {/* Always show standard tile, but check if enabled */}
                    {renderCompactTile(null, selectedBri, baseBri?.code, baseBriPrice, (c) => { setSelectedBri(c); })}
                    {briPackages.map(pkg => renderCompactTile(pkg, selectedBri, baseBri?.code, baseBriPrice, (c) => { setSelectedBri(c); }))}
                </div>
            </Modal>

            <Modal isOpen={isBsiModalOpen} onClose={() => setIsBsiModalOpen(false)} title="Pakiet Serwisowy (BSI)" maxWidth="max-w-4xl">
                <div className="space-y-5">

                    {/* BSI Section */}
                    <div>
                        <div className="flex items-end gap-2 mb-2 border-b border-gray-100 pb-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700">Service Inclusive</h4>
                            <span className="text-[10px] text-gray-400 pb-0.5">Przeglądy: olej, filtry, świece, płyn hamulcowy + robocizna</span>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {bsiPackages.map(pkg => renderCompactTile(pkg, selectedBsi, baseBsi?.code, baseBsiPrice, (c) => { setSelectedBsi(c); }))}
                        </div>
                    </div>

                    {/* BSI Plus Section */}
                    {bsiPlusPackages.length > 0 && (
                        <div>
                            <div className="flex items-end gap-2 mb-2 border-b border-gray-100 pb-1 mt-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    Service Inclusive Plus
                                </h4>
                                <span className="text-[10px] text-gray-400 pb-0.5">Zakres standardowy + klocki, tarcze, sprzęgło, pióra wycieraczek</span>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {bsiPlusPackages.map(pkg => renderCompactTile(pkg, selectedBsi, baseBsi?.code, baseBsiPrice, (c) => { setSelectedBsi(c); }))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

        </div>
    );
}
