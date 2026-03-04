import { notFound } from 'next/navigation';
import { getCarByVin, getCarVariants, getAvailableCars } from '@/lib/stock-fetch';
import { getAllDictionaries } from '@/lib/dictionary-fetch';
import { getServicePackages } from '@/lib/service-packages';
import { getActiveBulletins, getCarDiscountedPrice } from '@/lib/bulletin-fetch';
import { CarGallery } from '@/components/cars/CarGallery';
import { SpecsAccordion } from '@/components/cars/SpecsAccordion';
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
import { VinSelector } from '@/components/cars/VinSelector';

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

    const getOptionData = (code: string) => {
        const entry = optionDict[code];
        if (!entry) return undefined;
        if (!Array.isArray(entry)) {
            if (entry.variations && bodyGroup) {
                const variation = entry.variations.find((v: any) =>
                    v.body_groups && v.body_groups.includes(bodyGroup)
                );
                if (variation && variation.image) return { ...entry, image: variation.image };
            }
            return entry;
        }
        if (bodyGroup) {
            const match = entry.find((data: any) =>
                data.body_groups && Array.isArray(data.body_groups) && data.body_groups.includes(bodyGroup)
            );
            if (match) return match;
        }
        const generic = entry.find((data: any) => !data.body_groups || data.body_groups.length === 0);
        return generic || entry[0];
    };

    codes.forEach(raw => {
        const match = raw.match(/^([A-Z0-9]+)\s*\((.+)\)$/);
        if (match) {
            const pkgCode = match[1];
            if (restrictedCodes?.has(pkgCode)) return;
            const content = match[2];
            const kidsCodes = content.trim().split(/[\s,]+/).filter(Boolean);
            const kids: OptionItem[] = kidsCodes
                .filter(k => getOptionData(k)?.visible !== false)
                .map(k => {
                    const data = getOptionData(k);
                    return { code: k, name: data?.name, image: data?.image };
                });
            const pkgData = getOptionData(pkgCode);
            if (pkgData?.visible !== false) {
                groups.push({ type: 'package', code: pkgCode, name: pkgData?.name, image: pkgData?.image, children: kids });
            }
            kidsCodes.forEach(k => childrenSet.add(k));
        }
    });

    codes.forEach(raw => {
        if (!raw.match(/^([A-Z0-9]+)\s*\((.+)\)$/)) {
            const cleanCode = raw.trim();
            if (restrictedCodes?.has(cleanCode)) return;
            if (!childrenSet.has(cleanCode)) {
                const data = getOptionData(cleanCode);
                if (data?.visible !== false) {
                    groups.push({ type: 'standard', code: cleanCode, name: data?.name, image: data?.image, children: [] });
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
    const { vin } = await params;
    const decodedVin = decodeURIComponent(vin);
    const [car, dictionaries, servicePkgs, bulletins] = await Promise.all([
        getCarByVin(decodedVin),
        getAllDictionaries(),
        getServicePackages(),
        getActiveBulletins()
    ]);

    if (!car) notFound();

    const variants = await getCarVariants(car);
    const modelDict = dictionaries.model[car.model_code] || {};
    const modelName = modelDict.name || car.model_name || `BMW ${car.model_code}`;
    const colorName = dictionaries.color[car.color_code]?.name || car.color_code;
    const upholsteryName = dictionaries.upholstery[car.upholstery_code]?.name || car.upholstery_code;
    const staticAttrs = getModelAttributes(car.model_code);

    const enrichedCar = {
        ...car,
        model_name: modelName,
        series: staticAttrs.series || modelDict.series,
        body_type: staticAttrs.body_type || modelDict.body_type,
        power: modelDict.power || car.power,
        fuel_type: staticAttrs.fuel_type || modelDict.fuel || car.fuel_type,
        drivetrain: modelDict.drivetrain || car.drivetrain,
        acceleration: modelDict.acceleration,
        max_speed: modelDict.max_speed,
        trunk_capacity: modelDict.trunk_capacity,
        body_group: staticAttrs.body_group || car.body_group,
        special_price: getCarDiscountedPrice(car, bulletins) || car.special_price
    };

    const reservationStr = (car.reservation_details || '').trim();
    const restrictedCodes = new Set(servicePkgs.map(p => p.code));
    const optionGroups = parseOptionGroups(car.option_codes, dictionaries.option, car.body_group, restrictedCodes);

    const allImages = [...(car as any).group_images || [], ...(car.images || [])];
    const uniqueImages = Array.from(new Map(allImages.map(img => [img.url, img])).values());

    const allStock = await getAvailableCars();
    const isIdentical = (a: any, b: any) => {
        if (a.model_code !== b.model_code) return false;
        if (a.color_code !== b.color_code) return false;
        if (a.color_code === '490' && a.individual_color !== b.individual_color) return false;
        if (a.upholstery_code !== b.upholstery_code) return false;
        const yA = (a.production_date || '').substring(0, 4);
        const yB = (b.production_date || '').substring(0, 4);
        if (yA !== yB) return false;
        const optsA = [...(a.option_codes || [])].sort().join(',');
        const optsB = [...(b.option_codes || [])].sort().join(',');
        return optsA === optsB;
    };

    const siblings = allStock.filter(c => isIdentical(car, c));
    const totalAvailable = siblings.length;
    const effectiveIsReady = siblings.some(c => c.status_code > 190) || car.status_code > 190;

    const showSold = (car.order_status || '').includes('Sprzedany');
    const showReserved = !showSold && !!reservationStr && reservationStr.toLowerCase() !== 'rezerwuj';
    const showReady = !showSold && !showReserved && effectiveIsReady;

    const isMSeries = (enrichedCar.series || '').includes('Seria M') || enrichedCar.model_code?.startsWith('M');
    const isElectric = car.fuel_type === 'Elektryczny' || car.fuel_type === 'Electric';

    const theme = {
        bg: isMSeries ? 'bg-[#0a0a0a]' : 'bg-white',
        text: isMSeries ? 'text-gray-100' : 'text-gray-900',
        subtext: isMSeries ? 'text-gray-400' : 'text-gray-500',
        border: isMSeries ? 'border-white/10' : 'border-black/5',
        accentText: isMSeries ? 'text-white' : isElectric ? 'text-[#0653B6]' : 'text-black',
        accordionTitle: isMSeries ? 'text-white group-hover:text-blue-400' : isElectric ? 'text-gray-900 group-hover:text-[#0653B6]' : 'text-gray-900 group-hover:text-black',
    };

    return (
        <>
            <VdpStoreInit car={enrichedCar} siblings={siblings} />
            <main className={cn("min-h-screen font-sans pb-32 pt-20 lg:pt-24 transition-colors duration-500", theme.bg, theme.text)}>
                <div className="max-w-[1700px] mx-auto">
                    <div className="flex flex-col lg:flex-row min-h-screen gap-12 lg:gap-20 px-6">

                        {/* LEFT: Content Section */}
                        <div className="w-full lg:w-[62%] py-0 lg:py-12 space-y-16">

                            {/* Gallery Section - Full width on top of left content */}
                            <div className="-mx-6 lg:mx-0">
                                <CarGallery
                                    modelName={modelName}
                                    images={uniqueImages}
                                    isDark={isMSeries}
                                    isElectric={isElectric && !isMSeries}
                                />
                            </div>

                            {/* MOBILE ONLY: Action Buttons (under gallery) */}
                            <div className="lg:hidden px-0">
                                <CarActionButtons car={enrichedCar} />
                            </div>

                            {/* Technical Specs */}
                            <div className="space-y-px">
                                <div className="flex items-center gap-3 mb-10">
                                    <h3 className="text-[11px] text-gray-400 uppercase tracking-[0.4em] font-bold">Specyfikacja</h3>
                                    <div className="h-px flex-1 bg-current opacity-10" />
                                </div>
                                <SpecsAccordion title="Osiągi i Napęd" className={theme.border} titleClassName={theme.accordionTitle}>
                                    <div className={cn("py-4 text-sm space-y-2", isMSeries ? "text-gray-400" : "text-gray-600")}>
                                        <div className={cn("flex justify-between py-2 border-b", isMSeries ? "border-white/5" : "border-gray-50")}>
                                            <span>Moc</span>
                                            <span className={cn("font-medium", theme.accentText)}>{enrichedCar.power} KM</span>
                                        </div>
                                        <div className={cn("flex justify-between py-2 border-b", isMSeries ? "border-white/5" : "border-gray-50")}>
                                            <span>Przyspieszenie 0-100 km/h</span>
                                            <span className={cn("font-medium", theme.accentText)}>{enrichedCar.acceleration} s</span>
                                        </div>
                                        <div className={cn("flex justify-between py-2 border-b", isMSeries ? "border-white/5" : "border-gray-50")}>
                                            <span>Pojemność bagażnika</span>
                                            <span className={cn("font-medium", theme.accentText)}>{enrichedCar.trunk_capacity} l</span>
                                        </div>
                                    </div>
                                </SpecsAccordion>
                                <SpecsAccordion title="Kolor i Tapicerka" className={theme.border} titleClassName={theme.accordionTitle}>
                                    <div className={cn("py-4 text-sm space-y-4", isMSeries ? "text-gray-400" : "text-gray-600")}>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] uppercase font-black tracking-widest opacity-40">Kolor</span>
                                            <span className="font-bold uppercase text-[11px]">{colorName}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] uppercase font-black tracking-widest opacity-40">Tapicerka</span>
                                            <span className="font-bold uppercase text-[11px]">{upholsteryName}</span>
                                        </div>
                                    </div>
                                </SpecsAccordion>
                            </div>

                            {/* Service Packages */}
                            <ServicePackageConfiguratorSection
                                car={car}
                                seriesCode={enrichedCar.body_group || ''}
                                isDark={isMSeries}
                                fuelType={enrichedCar.fuel_type}
                            />

                            {/* Color Variants */}
                            {variants.length > 0 && (
                                <div className="space-y-10">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-[11px] text-gray-400 uppercase tracking-[0.4em] font-bold">Inna kolorystyka</h3>
                                        <div className="h-px flex-1 bg-current opacity-10" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {variants.map(v => {
                                            const vColor = v.color_code === '490'
                                                ? (dictionaries.color[v.individual_color || '']?.name || v.individual_color || 'BMW Individual')
                                                : (dictionaries.color[v.color_code || '']?.name || v.color_code);
                                            const vUpholstery = dictionaries.upholstery[v.upholstery_code || '']?.name || v.upholstery_code;
                                            const exteriorImg = v.images?.[0]?.url;
                                            const interiorImg = v.images && v.images.length > 0 ? v.images[v.images.length - 1]?.url : undefined;
                                            const isSoldVariant = (v.order_status || '').includes('Sprzedany');

                                            return (
                                                <Link
                                                    key={v.vin}
                                                    replace
                                                    href={`/cars/${v.vin}`}
                                                    className={cn(
                                                        "group flex flex-col gap-4 p-4 rounded-3xl border transition-all",
                                                        isMSeries ? "bg-white/5 border-white/10" : "bg-white border-black/[0.03]",
                                                        isSoldVariant
                                                            ? "opacity-60 grayscale-[0.5] pointer-events-none cursor-default"
                                                            : (isMSeries ? "hover:bg-white/10 hover:shadow-2xl hover:scale-[1.01]" : "hover:border-black/10 hover:shadow-2xl hover:scale-[1.01]")
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

                                                        {isSoldVariant && (
                                                            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                                                <div className="bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded-sm shadow-lg">
                                                                    <span className="text-white text-[9px] font-bold uppercase tracking-wider text-center drop-shadow-md">
                                                                        Sprzedany
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
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

                            {/* Options List */}
                            <OptionsList optionGroups={optionGroups} optionCodesCount={car.option_codes.length} isDark={isMSeries} isElectric={isElectric && !isMSeries} />
                        </div>

                        {/* RIGHT: Sticky Summary Section (Desktop Only) */}
                        <div className="hidden lg:flex lg:w-[38%] lg:sticky lg:top-24 lg:h-[calc(100vh-160px)] lg:flex-col lg:justify-start pt-0 pb-12 overflow-y-auto no-scrollbar">
                            {/* TOP: Identity & Status */}
                            <div className="space-y-6">
                                {/* Badges */}
                                <div className="flex flex-wrap gap-2">
                                    {showReady && (
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                            <div className="w-1 h-1 rounded-full bg-green-500" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-green-600">Dostępny</span>
                                        </div>
                                    )}
                                    {totalAvailable > 1 && (
                                        <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-blue-600">{totalAvailable} sztuki</span>
                                        </div>
                                    )}
                                </div>

                                {/* Title & Vin Selector */}
                                <div className="space-y-3">
                                    <h1 className={cn("text-4xl lg:text-5xl font-bold tracking-tight leading-none", theme.text)}>
                                        {modelName}
                                    </h1>
                                    <VinSelector currentVin={car.vin} siblings={siblings} isDark={isMSeries} />
                                </div>
                            </div>

                            {/* Controlled Dynamic Spacer: Distinct gap, but strictly limited to avoid extreme separation */}
                            <div className="h-[15vh] min-h-[100px] max-h-[250px]" />

                            {/* BOTTOM: Pricing & Action */}
                            <div className="space-y-6">
                                <DynamicPricingSection car={car} seriesCode={enrichedCar.body_group || ''} isDark={isMSeries} fuelType={enrichedCar.fuel_type} bulletinDiscountedPrice={getCarDiscountedPrice(car, bulletins)} />
                                <CarActionButtons car={enrichedCar} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
