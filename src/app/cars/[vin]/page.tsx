import { notFound } from 'next/navigation';
import { getCarByVin, getCarVariants, getAvailableCars } from '@/lib/stock-fetch';
import { getAllDictionaries } from '@/lib/dictionary-fetch';
import { getServicePackages } from '@/lib/service-packages';
import { getActiveBulletins, getCarDiscountedPrice } from '@/lib/bulletin-fetch';
import { CarGallery } from '@/components/cars/CarGallery';
import { SpecsAccordion } from '@/components/cars/SpecsAccordion';
import { BackButton } from '@/components/cars/BackButton';
import { OptionsList } from '@/components/cars/OptionsList';
import { Check, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import { DynamicPricingSection } from '@/components/cars/DynamicPricingSection';
import Link from 'next/link';
import { BMWIndividualBadge } from '@/components/cars/BMWIndividualBadge';
import { getModelAttributes } from '@/lib/model-attributes';
import { CarActionButtons } from '@/components/cars/CarActionButtons';
import { VdpStoreInit } from '@/components/cars/VdpStoreInit';
import { ServicePackageConfiguratorSection } from '@/components/cars/ServicePackageConfiguratorSection';
import { MobileStickyFooter } from '@/components/cars/MobileStickyFooter';

export const revalidate = 60;

interface OptionItem {
    code: string;
    name?: string;
    image?: string;
}

interface OptionGroup {
    type: 'package' | 'standard';
    code: string;
    name?: string;
    image?: string;
    children: OptionItem[];
}

function parseOptionGroups(codes: string[], optionDict: Record<string, any> = {}, bodyGroup?: string, restrictedCodes?: Set<string>): OptionGroup[] {
    const groups: OptionGroup[] = [];
    const childrenSet = new Set<string>();

    // Helper to find the best matching option entry
    const getOptionData = (code: string) => {
        const entry = optionDict[code];

        // If no entry exists, return undefined
        if (!entry) {
            return undefined;
        }

        // If entry is not an array, check for new 'variations' structure
        if (!Array.isArray(entry)) {
            if (entry.variations && bodyGroup) {
                const variation = entry.variations.find((v: any) =>
                    v.body_groups && v.body_groups.includes(bodyGroup)
                );
                if (variation && variation.image) {
                    return { ...entry, image: variation.image };
                }
            }
            return entry;
        }

        // Entry is an array of body-group variants
        // If we have a body group, look for a matching variant
        if (bodyGroup) {
            const match = entry.find((data: any) =>
                data.body_groups && Array.isArray(data.body_groups) && data.body_groups.includes(bodyGroup)
            );
            if (match) {
                return match;
            }
        }

        // Fallback to generic entry (no body_groups or empty array)
        const generic = entry.find((data: any) =>
            !data.body_groups || data.body_groups.length === 0
        );
        if (generic) {
            return generic;
        }

        // Final fallback: return first entry
        return entry[0];
    };

    // First pass: Identify packages and unique children
    codes.forEach(raw => {
        const match = raw.match(/^([A-Z0-9]+)\s*\((.+)\)$/);
        if (match) {
            const pkgCode = match[1];

            // Skip restricted codes (BSI/BRI)
            if (restrictedCodes?.has(pkgCode)) return;

            const content = match[2];
            // Split content by spaces or commas
            const kidsCodes = content.trim().split(/[\s,]+/).filter(Boolean);

            const kids: OptionItem[] = kidsCodes
                .filter(k => {
                    const data = getOptionData(k);
                    return data?.visible !== false;
                })
                .map(k => {
                    const data = getOptionData(k);
                    return {
                        code: k,
                        name: data?.name,
                        image: data?.image
                    };
                });

            // Only add package if it's visible (default true)
            const pkgData = getOptionData(pkgCode);
            if (pkgData?.visible !== false) {
                groups.push({
                    type: 'package',
                    code: pkgCode,
                    name: pkgData?.name,
                    image: pkgData?.image,
                    children: kids
                });
            }

            kidsCodes.forEach(k => childrenSet.add(k));
        }
    });

    // Second pass: Add standard options that form separate items
    // and are NOT in the childrenSet
    codes.forEach(raw => {
        if (!raw.match(/^([A-Z0-9]+)\s*\((.+)\)$/)) {
            // It's a standard code
            const cleanCode = raw.trim();

            // Skip restricted codes
            if (restrictedCodes?.has(cleanCode)) return;

            if (!childrenSet.has(cleanCode)) {
                // Only add if visible (default true)
                const data = getOptionData(cleanCode);
                if (data?.visible !== false) {
                    groups.push({
                        type: 'standard',
                        code: cleanCode,
                        name: data?.name,
                        image: data?.image,
                        children: []
                    });
                }
            }
        }
    });

    return groups.sort((a, b) => {
        if (a.type === 'package' && b.type === 'standard') return -1;
        if (a.type === 'standard' && b.type === 'package') return 1;
        return 0;
    });
}

interface PageProps {
    params: Promise<{ vin: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { vin } = await params;
    const [car, dictionaries] = await Promise.all([
        getCarByVin(decodeURIComponent(vin)),
        getAllDictionaries()
    ]);

    if (!car) return { title: 'Pojazd nieodnaleziony' };

    const name = dictionaries.model[car.model_code]?.name || car.model_name || `BMW ${car.model_code}`;
    const price = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(car.special_price || car.list_price);
    const mainImage = car.images?.[0]?.url || 'https://stock.bawariamotors.pl/images/car-cover.png';

    return {
        title: `${name} - Dostępny od ręki`,
        description: `Sprawdź BMW ${name} za ${price}. Samochód dostępny od ręki w Bawaria Motors. Pełna specyfikacja i zdjęcia.`,
        openGraph: {
            title: `${name} | Bawaria Motors`,
            description: `Nowe BMW ${name} dostępne od ręki. Cena: ${price}. Kliknij po szczegóły!`,
            images: [{ url: mainImage }],
        }
    };
}

export default async function CarPage({ params }: PageProps) {
    // Await params in case of Next.js 15+ compatibility
    const { vin } = await params;
    const decodedVin = decodeURIComponent(vin);

    const [car, dictionaries, servicePkgs, bulletins] = await Promise.all([
        getCarByVin(decodedVin),
        getAllDictionaries(),
        getServicePackages(),
        getActiveBulletins()
    ]);

    if (!car) {
        notFound();
    }

    const variants = await getCarVariants(car);

    const modelDict = dictionaries.model[car.model_code] || {};
    const modelName = modelDict.name || car.model_name || `BMW ${car.model_code}`;
    const colorName = dictionaries.color[car.color_code]?.name || car.color_code;
    const upholsteryName = dictionaries.upholstery[car.upholstery_code]?.name || car.upholstery_code;

    const staticAttrs = getModelAttributes(car.model_code);

    // Merge dictionary specs into car object for easier access
    const enrichedCar = {
        ...car,
        series: staticAttrs.series || modelDict.series,
        body_type: staticAttrs.body_type || modelDict.body_type,
        power: modelDict.power || car.power,
        fuel_type: staticAttrs.fuel_type || modelDict.fuel || car.fuel_type,
        drivetrain: modelDict.drivetrain || car.drivetrain,
        acceleration: modelDict.acceleration,
        max_speed: modelDict.max_speed,
        trunk_capacity: modelDict.trunk_capacity,
        body_group: staticAttrs.body_group || car.body_group, // Ensure we have a body group (series code)
        // Note: car.body_group might be null in stock feed
        special_price: getCarDiscountedPrice(car, bulletins) || car.special_price
    };

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency }).format(price);

    const reservationStr = (car.reservation_details || '').trim();

    const restrictedCodes = new Set(servicePkgs.map(p => p.code));
    const optionGroups = parseOptionGroups(car.option_codes, dictionaries.option, car.body_group, restrictedCodes);

    // Deduplicate gallery images
    const allImages = [...(car as any).group_images || [], ...(car.images || [])];
    const uniqueImages = Array.from(new Map(allImages.map(img => [img.url, img])).values());

    // Grouping / Identical Logic
    // We need to fetch all cars to find siblings (Inefficient but matches current architecture)
    // TODO: Optimize fetching
    const allStock = await getAvailableCars();

    const isIdentical = (a: any, b: any) => {
        if (a.model_code !== b.model_code) return false;
        if (a.color_code !== b.color_code) return false;
        if (a.upholstery_code !== b.upholstery_code) return false;

        // Year Check
        const yA = (a.production_date || '').substring(0, 4);
        const yB = (b.production_date || '').substring(0, 4);
        if (yA !== yB) return false;

        // Options Check
        const optsA = [...(a.option_codes || [])].sort().join(',');
        const optsB = [...(b.option_codes || [])].sort().join(',');
        return optsA === optsB;
    };

    const siblings = allStock.filter(c => isIdentical(car, c));
    const totalAvailable = siblings.length;

    // "Order Status - if at least one car has it greater than 190, label them all together as DOSTĘPNY OD RĘKI."
    const anyReady = siblings.some(c => c.status_code > 190);
    const effectiveIsReady = anyReady || car.status_code > 190;

    // Status Display Labels
    const showSold = (car.order_status || '').includes('Sprzedany');
    const showReserved = !showSold && !!reservationStr && reservationStr.toLowerCase() !== 'rezerwuj';
    const showReady = !showSold && !showReserved && effectiveIsReady;

    // BMW M Branding Logic
    const isMSeries = (enrichedCar.series || '').includes('Seria M');
    const isElectric = car.fuel_type === 'Elektryczny' || car.fuel_type === 'Electric';

    const theme = {
        bg: isMSeries ? 'bg-[#0f0f0f]' : 'bg-white',
        text: isMSeries ? 'text-gray-100' : 'text-gray-900',
        subtext: isMSeries ? 'text-gray-400' : 'text-gray-500',
        border: isMSeries ? 'border-[#222]' : 'border-gray-100',
        cardBg: isMSeries ? 'bg-[#1a1a1a]' : 'bg-white',
        cardBorder: isMSeries ? 'border-[#333]' : 'border-gray-100',
        accordionTitle: isMSeries ? 'text-white group-hover:text-blue-400' : isElectric ? 'text-gray-900 group-hover:text-[#0653B6]' : 'text-gray-900 group-hover:text-black',
        navBg: isMSeries ? 'bg-[#0f0f0f]/80' : 'bg-white/80',
        accentText: isMSeries ? 'text-white' : isElectric ? 'text-[#0653B6]' : 'text-black',
    };

    return (
        <main className={cn("min-h-screen font-sans pb-32 pt-12 lg:pt-12 transition-colors duration-500", theme.bg, theme.text)}>
            {/* MOBILE: Sticky Header */}
            <div className={cn(
                "fixed top-0 left-0 right-0 z-[100] lg:hidden border-b px-6 py-4 backdrop-blur-2xl transition-all duration-500",
                isMSeries ? "bg-[#0f0f0f]/80 border-white/10" : "bg-white/80 border-black/5"
            )}>
                <div className="flex items-center gap-4">
                    <BackButton
                        label=""
                        className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full border transition-all active:scale-95",
                            isMSeries ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/5 text-black"
                        )}
                    />
                    <div className="flex flex-col min-w-0">
                        <h2 className="text-xl font-black tracking-tight truncate leading-none mb-1">{modelName}</h2>
                        <div className="flex items-center gap-2">
                            {showReady && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                                {showReady ? 'Dostępny od ręki' : showSold ? 'Sprzedany' : 'W ofercie'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <VdpStoreInit car={enrichedCar} siblings={siblings} />

            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 px-6 pt-12 lg:pt-8">

                {/* LEFT: Gallery + Specs + Options */}
                <div className="lg:col-span-8">
                    {/* Merge unique images */}
                    <CarGallery
                        modelName={modelName}
                        images={uniqueImages}
                        isDark={isMSeries}
                        isElectric={isElectric && !isMSeries}
                    />

                    {/* Car Variants (Config Twins) - Moved between Gallery and Specs for better exposure */}
                    {variants.length > 0 && (
                        <div className={cn("mt-12", theme.border)}>
                            <div className="flex items-center gap-3 mb-10">
                                <h3 className="text-[11px] text-gray-400 uppercase tracking-[0.4em] font-bold">Inna kolorystyka</h3>
                                <div className="h-px flex-1 bg-current opacity-10" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {variants.map(v => {
                                    const vColor = dictionaries.color[v.color_code || '']?.name || v.color_code;
                                    const vUpholstery = dictionaries.upholstery[v.upholstery_code || '']?.name || v.upholstery_code;

                                    const exteriorImg = v.images?.[0]?.url;
                                    const interiorImg = v.images && v.images.length > 0 ? v.images[v.images.length - 1]?.url : undefined;

                                    return (
                                        <Link
                                            key={v.vin}
                                            replace
                                            href={`/cars/${v.vin}`}
                                            className={cn(
                                                "group flex flex-col gap-4 p-4 rounded-3xl border transition-all hover:shadow-2xl hover:scale-[1.01]",
                                                isMSeries ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-black/[0.03] hover:border-black/10"
                                            )}
                                        >
                                            {/* Image Composite - Side-by-Side Duo Split */}
                                            <div className="relative aspect-[21/9] w-full shrink-0 flex overflow-hidden rounded-2xl bg-gray-100 group border border-black/[0.03]">
                                                {/* Exterior (Left 50%) */}
                                                <div className="w-1/2 h-full bg-white relative overflow-hidden">
                                                    {exteriorImg ? (
                                                        <img src={exteriorImg} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-100" />
                                                    )}
                                                    <div className="absolute right-0 inset-y-0 w-px bg-black/[0.1] z-10" />
                                                </div>

                                                {/* Interior (Right 50%) */}
                                                <div className="w-1/2 h-full bg-gray-50 relative overflow-hidden">
                                                    {interiorImg ? (
                                                        <img src={interiorImg} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Text Info */}
                                            <div className="flex flex-col min-w-0">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-[0.1em] truncate mb-0.5",
                                                    isMSeries ? "text-gray-100" : "text-gray-900"
                                                )}>
                                                    {vColor}
                                                </span>
                                                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest truncate">
                                                    {vUpholstery}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Specs Section - Unified Technical Base */}
                    <div className={cn("mt-12 space-y-px", theme.border)}>
                        <div className="flex items-center gap-3 mb-10">
                            <h3 className="text-[11px] text-gray-400 uppercase tracking-[0.4em] font-bold">Dane techniczne i specyfikacja</h3>
                            <div className="h-px flex-1 bg-current opacity-10" />
                        </div>

                        <SpecsAccordion title="Osiągi i Napęd" className={theme.border} titleClassName={theme.accordionTitle}>
                            <div className={cn("py-4 text-sm space-y-2", isMSeries ? "text-gray-400" : "text-gray-600")}>
                                <div className={cn("flex justify-between py-2 border-b", isMSeries ? "border-gray-800" : "border-gray-50")}>
                                    <span>Moc</span>
                                    <span className={cn("font-medium", theme.accentText)}>{enrichedCar.power} KM</span>
                                </div>

                                <div className={cn("flex justify-between py-2 border-b", isMSeries ? "border-gray-800" : "border-gray-50")}>
                                    <span>Przyspieszenie 0-100 km/h</span>
                                    <span className={cn("font-medium", theme.accentText)}>{enrichedCar.acceleration} s</span>
                                </div>
                                <div className={cn("flex justify-between py-2 border-b", isMSeries ? "border-gray-800" : "border-gray-50")}>
                                    <span>Rodzaj paliwa</span>
                                    <span className={cn("font-medium", theme.accentText)}>{isElectric ? 'Elektryczny' : enrichedCar.fuel_type}</span>
                                </div>
                                <div className={cn("flex justify-between py-2 border-b", isMSeries ? "border-gray-800" : "border-gray-50")}>
                                    <span>Rodzaj napędu</span>
                                    <span className={cn("font-medium", theme.accentText)}>
                                        {dictionaries.drivetrain[car.drivetrain || '']?.name || car.drivetrain}
                                    </span>
                                </div>
                                <div className={cn("flex justify-between py-2 border-b", isMSeries ? "border-gray-800" : "border-gray-50")}>
                                    <span>Prędkość maksymalna</span>
                                    <span className={cn("font-medium", theme.accentText)}>{enrichedCar.max_speed} km/h</span>
                                </div>
                                <div className={cn("flex justify-between py-2 border-b", isMSeries ? "border-gray-800" : "border-gray-50")}>
                                    <span>Pojemność bagażnika</span>
                                    <span className={cn("font-medium", theme.accentText)}>{enrichedCar.trunk_capacity} l</span>
                                </div>
                            </div>
                        </SpecsAccordion>

                        <SpecsAccordion title="Seria i Nadwozie" className={theme.border} titleClassName={theme.accordionTitle}>
                            <div className={cn("py-4 text-sm space-y-2", isMSeries ? "text-gray-400" : "text-gray-600")}>
                                <div className={cn("flex justify-between py-2 border-b", isMSeries ? "border-gray-800" : "border-gray-50")}>
                                    <span>Rok produkcji</span>
                                    <span className={cn("font-medium", isMSeries ? "text-white" : "text-black")}>
                                        {car.production_date ? new Date(car.production_date).getFullYear() : '2024'}
                                    </span>
                                </div>
                                <div className={cn("flex justify-between py-2 border-b", isMSeries ? "border-gray-800" : "border-gray-50")}>
                                    <span>Seria</span>
                                    <span className={cn("font-medium", isMSeries ? "text-white" : "text-black")}>{enrichedCar.series}</span>
                                </div>
                                <div className={cn("flex justify-between py-2 border-b", isMSeries ? "border-gray-800" : "border-gray-50")}>
                                    <span>Typ nadwozia</span>
                                    <span className={cn("font-medium", isMSeries ? "text-white" : "text-black")}>{enrichedCar.body_type}</span>
                                </div>
                            </div>
                        </SpecsAccordion>

                        <SpecsAccordion title="Tapicerka i kolor" className={theme.border} titleClassName={theme.accordionTitle}>
                            <div className={cn("py-4 text-sm space-y-2", isMSeries ? "text-gray-400" : "text-gray-600")}>
                                <div className={cn("flex justify-between py-4 items-center border-b last:border-0", isMSeries ? "border-gray-800" : "border-gray-100")}>
                                    <span className="opacity-40 uppercase text-[9px] font-black tracking-widest">Kolor</span>
                                    {car.color_code === '490' ? (
                                        <BMWIndividualBadge compact colorName={dictionaries.color[car.individual_color || '']?.name || car.individual_color} />
                                    ) : (
                                        <span className={cn("font-bold uppercase text-[11px] tracking-wider", isMSeries ? "text-white" : "text-black")}>{colorName}</span>
                                    )}
                                </div>
                                <div className={cn("flex justify-between py-4 items-center border-b last:border-0", isMSeries ? "border-gray-800" : "border-gray-100")}>
                                    <span className="opacity-40 uppercase text-[9px] font-black tracking-widest">Tapicerka</span>
                                    <span className={cn("font-bold uppercase text-[11px] tracking-wider", isMSeries ? "text-white" : "text-black")}>{upholsteryName}</span>
                                </div>
                                <div className={cn("flex justify-between py-4 items-center border-b last:border-0", isMSeries ? "border-gray-800" : "border-gray-100")}>
                                    <span className="opacity-40 uppercase text-[9px] font-black tracking-widest">Numer VIN</span>
                                    <span className={cn("font-mono font-bold uppercase text-[10px] tracking-widest", isMSeries ? "text-white" : "text-black")}>{car.vin}</span>
                                </div>
                            </div>
                        </SpecsAccordion>
                    </div>

                    {/* Service Package Configurator - Moved here from sidebar */}
                    <ServicePackageConfiguratorSection
                        car={car}
                        seriesCode={enrichedCar.body_group || ''}
                        isDark={isMSeries}
                        fuelType={enrichedCar.fuel_type}
                    />

                    {/* Options List - Performance & Equipment */}
                    <div className="mt-12">
                        <OptionsList optionGroups={optionGroups} optionCodesCount={car.option_codes.length} isDark={isMSeries} isElectric={isElectric && !isMSeries} />
                    </div>
                </div>

                {/* RIGHT: Info Summary & Sticky Sidebar (Price & Call to Actions) */}
                <div className="hidden lg:block lg:col-span-4 lg:relative">
                    <div className="lg:sticky lg:top-28 space-y-8 pb-12 pt-4 lg:pt-0">

                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                            {showSold && (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Sprzedany</span>
                                </div>
                            )}

                            {showReady && (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-600">Dostępny od ręki</span>
                                </div>
                            )}

                            {showReserved && (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-600">Zarezerwowany</span>
                                </div>
                            )}

                            {totalAvailable > 1 && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/5 rounded-full border border-blue-500/10">
                                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{totalAvailable} egzemplarze</span>
                                </div>
                            )}
                        </div>

                        {/* Model & Primary Info */}
                        <div>
                            <h1 className={cn("text-5xl lg:text-7xl font-bold tracking-tight leading-[1] mb-6", theme.text)}>
                                {modelName}
                            </h1>
                            {car.color_code === '490' ? (
                                <div className="mt-8 mb-4">
                                    <BMWIndividualBadge colorName={dictionaries.color[car.individual_color || '']?.name || car.individual_color} />
                                </div>
                            ) : (
                                <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-40", theme.subtext)}>
                                    Lakier: {colorName}
                                </p>
                            )}
                        </div>

                        {/* Action Buttons: Garage & Compare */}
                        <CarActionButtons car={enrichedCar} className="mt-6" />

                        {/* Pricing Section stays on right */}
                        <DynamicPricingSection car={car} seriesCode={enrichedCar.body_group || ''} isDark={isMSeries} fuelType={enrichedCar.fuel_type} bulletinDiscountedPrice={getCarDiscountedPrice(car, bulletins)} />
                    </div>
                </div>
            </div>

            {/* MOBILE: Sticky Footer */}
            <MobileStickyFooter
                car={car}
                isDark={isMSeries}
                bulletinDiscountedPrice={getCarDiscountedPrice(car, bulletins)}
            />
        </main>
    );
}
