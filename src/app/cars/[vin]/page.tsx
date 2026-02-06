import { notFound } from 'next/navigation';
import { getCarByVin, getCarVariants } from '@/lib/stock-fetch';
import { getAllDictionaries } from '@/lib/dictionary-fetch';
import { getServicePackages } from '@/lib/service-packages';
import { CarGallery } from '@/components/cars/CarGallery';
import { SpecsAccordion } from '@/components/cars/SpecsAccordion';
import { BackButton } from '@/components/cars/BackButton';
import { OptionsList } from '@/components/cars/OptionsList';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import { DynamicPricingSection } from '@/components/cars/DynamicPricingSection';
import Link from 'next/link';

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

    const [car, dictionaries, servicePkgs] = await Promise.all([
        getCarByVin(decodedVin),
        getAllDictionaries(),
        getServicePackages()
    ]);

    if (!car) {
        notFound();
    }

    const variants = await getCarVariants(car);

    const modelDict = dictionaries.model[car.model_code] || {};
    const modelName = modelDict.name || car.model_name || `BMW ${car.model_code}`;
    const colorName = dictionaries.color[car.color_code]?.name || car.color_code;
    const upholsteryName = dictionaries.upholstery[car.upholstery_code]?.name || car.upholstery_code;

    // Merge dictionary specs into car object for easier access
    const enrichedCar = {
        ...car,
        series: modelDict.series,
        body_type: modelDict.body_type,
        power: modelDict.power || car.power,
        fuel_type: modelDict.fuel || car.fuel_type,
        drivetrain: modelDict.drivetrain || car.drivetrain,
        acceleration: modelDict.acceleration,
        max_speed: modelDict.max_speed,
        trunk_capacity: modelDict.trunk_capacity
    };

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency }).format(price);

    const isSold = (car.order_status || '').includes('Sprzedany');
    const reservationStr = (car.reservation_details || '').trim();
    const isReserved = !!reservationStr && reservationStr.toLowerCase() !== 'rezerwuj';
    // Available if status > 190 (regardless of reservation)
    const isReady = car.status_code > 190;

    const restrictedCodes = new Set(servicePkgs.map(p => p.code));
    const optionGroups = parseOptionGroups(car.option_codes, dictionaries.option, car.body_group, restrictedCodes);

    return (
        <main className="min-h-screen bg-white text-gray-900 font-sans pb-20">
            {/* ... nav ... */}
            <nav className="border-b border-gray-100 py-6 px-6 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="max-w-[1600px] mx-auto flex items-center gap-4">
                    <BackButton
                        label="Wróć do listy"
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                    />
                    <div className="h-4 w-px bg-gray-200 mx-2" />
                    <span className="text-xs text-gray-400 font-mono tracking-wide">{car.vin}</span>
                </div>
            </nav>

            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 px-6 pt-12">

                {/* LEFT: Gallery + Specs + Options */}
                <div className="lg:col-span-8">
                    <CarGallery
                        modelName={modelName}
                        images={car.images}
                    />

                    {/* Accordions - Desktop/Tablet Position (between gallery and options) */}
                    <div className="hidden lg:block mt-16 space-y-px border-t border-gray-100 pt-6">
                        <SpecsAccordion title="Dane techniczne">
                            <div className="py-4 text-sm text-gray-600 space-y-2">
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span>Moc</span>
                                    <span className="font-medium text-black">{enrichedCar.power} KM</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span>Przyspieszenie 0-100 km/h</span>
                                    <span className="font-medium text-black">{enrichedCar.acceleration} s</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span>Rodzaj paliwa</span>
                                    <span className="font-medium text-black">{enrichedCar.fuel_type}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span>Rodzaj napędu</span>
                                    <span className="font-medium text-black">
                                        {dictionaries.drivetrain[car.drivetrain || '']?.name || car.drivetrain}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span>Prędkość maksymalna</span>
                                    <span className="font-medium text-black">{enrichedCar.max_speed} km/h</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span>Pojemność bagażnika</span>
                                    <span className="font-medium text-black">{enrichedCar.trunk_capacity} l</span>
                                </div>
                            </div>
                        </SpecsAccordion>

                        <SpecsAccordion title="Seria i Nadwozie">
                            <div className="py-4 text-sm text-gray-600 space-y-2">
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span>Seria</span>
                                    <span className="font-medium text-black">{enrichedCar.series}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span>Typ nadwozia</span>
                                    <span className="font-medium text-black">{enrichedCar.body_type}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span>Kod modelu</span>
                                    <span className="font-medium text-black">{enrichedCar.model_code}</span>
                                </div>
                            </div>
                        </SpecsAccordion>

                        <SpecsAccordion title="Tapicerka i kolor">
                            <div className="py-4 text-sm text-gray-600 space-y-2">
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span>Kolor</span>
                                    <span className="font-medium text-black">{colorName}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span>Tapicerka</span>
                                    <span className="font-medium text-black">{upholsteryName}</span>
                                </div>
                            </div>
                        </SpecsAccordion>
                    </div>

                    {/* Options List - Desktop Position */}
                    <div className="hidden lg:block mt-16 max-h-[800px] overflow-y-auto pr-4 -mr-4">
                        <OptionsList optionGroups={optionGroups} optionCodesCount={car.option_codes.length} />
                    </div>
                </div>

                {/* RIGHT: Info & Sticky Sidebar (Price only) */}
                <div className="lg:col-span-4">
                    <div className="sticky top-28 space-y-8">

                        {/* Header Info */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                {isSold && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-sm">
                                        Sprzedany
                                    </span>
                                )}

                                {!isSold && isReady && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-sm">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        Dostępny od ręki
                                    </span>
                                )}

                                {!isSold && isReserved && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded-sm">
                                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                                        Zarezerwowany
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-2">
                                {modelName}
                            </h1>
                            <p className="text-gray-500 text-lg font-light">
                                {colorName}
                            </p>

                            {/* Car Variants (Config Twins) */}
                            {variants.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h3 className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-4 italic">Sprawdź inne dostępne kolorystyki:</h3>
                                    <div className="flex flex-col gap-2">
                                        {variants.map(v => {
                                            const vColor = dictionaries.color[v.color_code || '']?.name || v.color_code;
                                            const vUpholstery = dictionaries.upholstery[v.upholstery_code || '']?.name || v.upholstery_code;

                                            // Get first exterior and last interior images (matching SRP logic)
                                            const exteriorImg = v.images?.[0]?.url;
                                            const interiorImg = v.images && v.images.length > 0 ? v.images[v.images.length - 1]?.url : undefined;

                                            return (
                                                <Link
                                                    key={v.vin}
                                                    href={`/cars/${v.vin}`}
                                                    className="group flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-sm hover:border-black hover:shadow-sm transition-all"
                                                >
                                                    {/* Image Previews */}
                                                    <div className="flex gap-2 shrink-0">
                                                        {exteriorImg && (
                                                            <div className="w-16 h-16 bg-gray-100 rounded-sm overflow-hidden">
                                                                <img
                                                                    src={exteriorImg}
                                                                    alt="Exterior"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                        {interiorImg && (
                                                            <div className="w-16 h-16 bg-gray-100 rounded-sm overflow-hidden">
                                                                <img
                                                                    src={interiorImg}
                                                                    alt="Interior"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Text Info */}
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-gray-900 group-hover:text-black">
                                                            {vColor}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500">
                                                            {vUpholstery}
                                                        </span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>



                        {/* Price Card & Service Configurator */}
                        <DynamicPricingSection car={car} seriesCode={car.body_group || ''} />

                        {/* Accordions - Mobile Only */}
                        <div className="lg:hidden space-y-px border-t border-gray-100 pt-6">
                            <SpecsAccordion title="Dane techniczne">
                                <div className="py-4 text-sm text-gray-600 space-y-2">
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span>Moc</span>
                                        <span className="font-medium text-black">{enrichedCar.power} KM</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span>Przyspieszenie 0-100 km/h</span>
                                        <span className="font-medium text-black">{enrichedCar.acceleration} s</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span>Rodzaj paliwa</span>
                                        <span className="font-medium text-black">{enrichedCar.fuel_type}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span>Rodzaj napędu</span>
                                        <span className="font-medium text-black">
                                            {dictionaries.drivetrain[car.drivetrain || '']?.name || car.drivetrain}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span>Prędkość maksymalna</span>
                                        <span className="font-medium text-black">{enrichedCar.max_speed} km/h</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span>Pojemność bagażnika</span>
                                        <span className="font-medium text-black">{enrichedCar.trunk_capacity} l</span>
                                    </div>
                                </div>
                            </SpecsAccordion>

                            <SpecsAccordion title="Seria i Nadwozie">
                                <div className="py-4 text-sm text-gray-600 space-y-2">
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span>Seria</span>
                                        <span className="font-medium text-black">{enrichedCar.series}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span>Typ nadwozia</span>
                                        <span className="font-medium text-black">{enrichedCar.body_type}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span>Kod modelu</span>
                                        <span className="font-medium text-black">{enrichedCar.model_code}</span>
                                    </div>
                                </div>
                            </SpecsAccordion>

                            <SpecsAccordion title="Tapicerka i kolor">
                                <div className="py-4 text-sm text-gray-600 space-y-2">
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span>Kolor</span>
                                        <span className="font-medium text-black">{colorName}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span>Tapicerka</span>
                                        <span className="font-medium text-black">{upholsteryName}</span>
                                    </div>
                                </div>
                            </SpecsAccordion>
                        </div>

                    </div>
                </div>



                {/* Mobile Options List (Bottom) */}
                <div className="lg:hidden mt-2 pt-6 border-t border-gray-100 px-4">
                    <OptionsList optionGroups={optionGroups} optionCodesCount={car.option_codes.length} />
                </div>

            </div>
        </main >
    );
}
