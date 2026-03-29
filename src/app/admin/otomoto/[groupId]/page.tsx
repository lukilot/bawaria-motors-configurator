'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { ProductGroup, StockCar } from '@/types/stock';
import { Loader2, ArrowLeft, Download, CheckCircle, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import JSZip from 'jszip';
import { getActiveBulletins, getCarDiscountedPrice, Bulletin } from '@/lib/bulletin-fetch';
import { resolveDictionaryEntry, getAllDictionaries } from '@/lib/dictionary-fetch';
import { getChassisCode } from '@/lib/chassis-mapping';

// Basic helper to format price
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(price);
};

export default function OtomotoGeneratorPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;

    const [group, setGroup] = useState<ProductGroup | null>(null);
    const [dictionaries, setDictionaries] = useState<any>({});
    const [bulletins, setBulletins] = useState<Bulletin[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Otomoto state
    const [otomotoUrl, setOtomotoUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [downloadingZip, setDownloadingZip] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            // 1. Fetch Group and Stock Cars
            const { data: groupData, error: groupErr } = await supabase
                .from('product_groups')
                .select(`*, stock_units(*)`)
                .eq('id', groupId)
                .single();

            if (groupData) {
                const mappedGroup: ProductGroup = {
                    ...groupData,
                    available_units: groupData.stock_units as StockCar[]
                };
                setGroup(mappedGroup);
                setOtomotoUrl(mappedGroup.otomoto_url || '');
            }

            // 2. Fetch Dictionaries (Using shared helper to avoid 1000-row limit)
            const dicts = await getAllDictionaries();
            setDictionaries(dicts);

            // 3. Fetch Bulletins
            const b = await getActiveBulletins();
            setBulletins(b);

            setLoading(false);
        };

        if (groupId) fetchData();
    }, [groupId]);

    const handleSaveStatus = async () => {
        setSaving(true);
        const urlStr = otomotoUrl.trim();
        const isNowListed = urlStr.length > 0;

        const { error } = await supabase
            .from('product_groups')
            .update({
                otomoto_listed: isNowListed,
                otomoto_url: isNowListed ? urlStr : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', groupId);

        setSaving(false);
        if (error) {
            alert('Błąd podczas zapisywania: ' + error.message);
        } else {
            alert('Sukces! Status grupy zaktualizowany.');
            router.refresh();
        }
    };

    const downloadImagesZip = async () => {
        if (!group) return;
        setDownloadingZip(true);
        try {
            const zip = new JSZip();
            const allImages = [...(group.images || [])];
            const units = group.available_units || [];
            if (units.length > 0 && units[0].images) {
                allImages.push(...units[0].images);
            }
            
            // Deduplicate by URL
            const uniqueImages = Array.from(new Map(allImages.map(img => [img.url, img])).values());
            
            if (uniqueImages.length === 0) {
                alert('Brak zdjęć do pobrania.');
                setDownloadingZip(false);
                return;
            }

            // Folder in ZIP - Safe name without special characters like |
            const carVin = (units.length > 0 && units[0].vin) ? units[0].vin.slice(-7) : group.id.split('-')[0];
            const safeModelCode = group.model_code.replace(/[^a-zA-Z0-9]/g, '');
            const folderName = `Otomoto_${safeModelCode}_${carVin}`;
            const folder = zip.folder(folderName);

            // Fetch and append each image
            await Promise.all(uniqueImages.map(async (img, idx) => {
                const response = await fetch(img.url);
                const blob = await response.blob();
                folder?.file(`Photo_${idx + 1}.jpg`, blob);
            }));

            // Generate zip file
            const content = await zip.generateAsync({ type: 'blob' });
            
            // Trigger download via fake link
            const url = window.URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${folderName}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Błąd pobierania ZIP:', error);
            alert('Błąd podczas pobierania paczki zdjęć.');
        } finally {
            setDownloadingZip(false);
        }
    };

    // --- Template Generation Logic ---
    const generateOtomotoText = () => {
        if (!group || !dictionaries.model) return 'Trwa ładowanie danych...';

        const car = group.available_units?.[0]; // Base the text on the first available unit for VIN/Prices
        if (!car) return 'Brak aut w grupie (grupa całkowicie wyprzedana). Ogłoszenie niemożliwe.';

        const bodyGroup = car.body_group || getChassisCode(car.model_code);

        // Car core data
        const modelDict = dictionaries.model[car.model_code] || {};
        const modelName = modelDict.name || car.model_name || `BMW ${car.model_code}`;
        const engineDesc = `${modelDict.fuel || car.fuel_type || 'benzyna/diesel'} ${modelDict.power || car.power || 'b.d.'} KM, skrzynia automatyczna, ${modelDict.drivetrain || car.drivetrain || 'napęd b.d.'}`;
        
        // Colors
        let paintName = group.color_code || '';
        const dictColorOpt = resolveDictionaryEntry(group.color_code, dictionaries, 'color', bodyGroup);

        if (dictColorOpt) {
            paintName = dictColorOpt.name || group.color_code;
            if (paintName.toLowerCase() === 'brak nazwy' && car.individual_color) {
                paintName = car.individual_color;
            }
        }
        const paintDisplay = paintName && paintName !== group.color_code ? paintName : '';

        let upholsteryName = group.upholstery_code || '';
        const dictUpholsteryOpt = resolveDictionaryEntry(group.upholstery_code, dictionaries, 'upholstery', bodyGroup);
        if (dictUpholsteryOpt) {
            upholsteryName = dictUpholsteryOpt.name || group.upholstery_code;
        }

        // Prices
        // Identical mapping as the VDP interface - no custom overriding logic here
        const listPrice = car.list_price || group.manual_price || group.max_price || group.min_price || 0;
        const enrichedCar = { ...car, list_price: listPrice };
        let discountPrice = getCarDiscountedPrice(enrichedCar, bulletins) || car.special_price || listPrice;
        
        // Extract all individual codes for wheels/trims lookup
        const allFlatCodes = new Set<string>();
        (group.option_codes || []).forEach(oc => {
            const raw = oc.trim();
            const matchPkg = raw.match(/^([A-Z0-9]+)\s*\((.+)\)$/);
            if (matchPkg) {
                allFlatCodes.add(matchPkg[1]);
                matchPkg[2].trim().split(/[\s,]+/).filter(Boolean).forEach(k => allFlatCodes.add(k));
            } else {
                const cleanCode = raw.match(/^([A-Z0-9]+)/)?.[1];
                if (cleanCode) allFlatCodes.add(cleanCode);
            }
        });

        const getOptionName = (code: string) => {
            let opt = resolveDictionaryEntry(code, dictionaries, 'option', bodyGroup, true);
            
            // Hide globally hidden options from Otomoto
            if (opt && (opt.hidden === true || opt.visible === false)) {
                return '[HIDDEN]';
            }

            if (!opt || !opt.name) {
                // Hardcoded fallback for some common BMW options if missing in DB
                if (code === '2PA') return 'Śruby zabezpieczające';
                if (code === '2VB') return 'System monitorowania ciśnienia opon';
                if (code === '428') return 'Trójkąt ostrzegawczy / apteczka / gaśnica';
                if (code === '302') return 'System alarmowy';
                if (code === '6AE') return 'Teleserwis';
                if (code === '6AF') return 'Połączenie alarmowe';
                if (code === '6AK') return 'Usługi ConnectedDrive';
                if (code === '6C4') return 'Pakiet Connected Professional';
                return `Opcja ${code}`; // Return dummy so it doesn't break
            }
            return opt.name;
        };

        let wheelsStr = 'b.d.';
        let interiorTrim = 'b.d.';
        Array.from(allFlatCodes).forEach(code => {
            const name = getOptionName(code);
            if (!name || name === '[HIDDEN]') return;
            
            const normalizedCode = code.startsWith('0') ? code.substring(1) : code;
            if (normalizedCode.startsWith('1') || normalizedCode.startsWith('3G') || name.toLowerCase().includes('obręcze') || name.toLowerCase().includes('koła')) {
                if (wheelsStr === 'b.d.') wheelsStr = `${code} ${name}`;
            }
            if (normalizedCode.startsWith('43') || normalizedCode.startsWith('4M') || name.toLowerCase().includes('listwy ozdobne') || normalizedCode === '4F4' || normalizedCode === '4KN') {
                if (interiorTrim === 'b.d.') interiorTrim = `${code} ${name}`;
            }
        });

        const stdLines: string[] = [];
        const optLines: string[] = [];
        const pkgLines: string[] = [];
        const serviceLines: string[] = [];
        
        const standardCodes = ['2PA', '2VB', '428', '302', '6AE', '6AF', '6AK', '6C4', '2TE', '2VV', '488', '4T2', '4U8', '4U9', '4UR', '4V1', '552', '654', '674', '6NX', '6PA'];

        (group.option_codes || []).forEach(oc => {
            const raw = oc.trim();
            const matchPkg = raw.match(/^([A-Z0-9]+)\s*\((.+)\)$/);
            
            if (matchPkg) {
                const pkgCode = matchPkg[1];
                const pkgName = getOptionName(pkgCode);
                if (!pkgName || pkgName === '[HIDDEN]') return;
                
                const kidsCodes = matchPkg[2].trim().split(/[\s,]+/).filter(Boolean);
                const childrenNames: string[] = [];
                kidsCodes.forEach(k => {
                     const kn = getOptionName(k);
                     if (kn && kn !== '[HIDDEN]') childrenNames.push(`  - ${k} ${kn}`);
                });
                
                let block = `- ${pkgCode} ${pkgName}`;
                if (childrenNames.length > 0) {
                     block += '\n' + childrenNames.join('\n');
                }
                
                const normalizedPkgCode = pkgCode.startsWith('0') ? pkgCode.substring(1) : pkgCode;
                if (normalizedPkgCode.startsWith('7N') || normalizedPkgCode.startsWith('7C')) {
                    serviceLines.push(block);
                } else {
                    pkgLines.push(block);
                }
            } else {
                const codeMatch = raw.match(/^([A-Z0-9]+)/);
                if (!codeMatch) return;
                const code = codeMatch[1];
                const name = getOptionName(code);
                if (!name || name === '[HIDDEN]') return;
                
                const normalizedCode = code.startsWith('0') ? code.substring(1) : code;
                const line = `- ${code} ${name}`;
                
                if (normalizedCode.startsWith('7N') || normalizedCode.startsWith('7C')) {
                    serviceLines.push(line);
                } else if (standardCodes.includes(normalizedCode)) {
                    stdLines.push(line);
                } else {
                    optLines.push(line);
                }
            }
        });

        // Formatting currency explicitly to PLN
        const fmtPLN = (v: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(v).replace('PLN', ' PLN');

        return `<b>BMW ${modelName}</b>

Silnik ${engineDesc}

<b>Numer oferty:</b> ${group.id.split('-')[0].toUpperCase()}

<b>AUTO DOSTĘPNE OD RĘKI</b>

- <b>cena katalogowa</b> ${fmtPLN(listPrice)} brutto
- <b>cena promocyjna</b> ${fmtPLN(discountPrice)} brutto

─────────────────────────────────────────────────────────────

Zapraszamy do bezpośredniego kontaktu:

<b>Łukasz Łotoszyński</b>
lotoszynski_l(at)bmw-bawariamotors.pl
+48 508-020-612

─────────────────────────────────────────────────────────────

<b>Lakier:</b> ${group.color_code} ${paintDisplay}
<b>Tapicerka:</b> ${group.upholstery_code} ${upholsteryName}
<b>Listwy:</b> ${interiorTrim}
<b>Koła (opony letnie):</b> ${wheelsStr}

<b>Wyposażenie standardowe:</b>
${stdLines.length > 0 ? stdLines.join('\n') : 'Brak danych'}

<b>Wyposażenie opcjonalne:</b>
${pkgLines.length > 0 ? pkgLines.join('\n') : ''}
${optLines.length > 0 ? optLines.join('\n') : ''}

<b>Usługi:</b>
${serviceLines.length > 0 ? serviceLines.join('\n') : 'Brak usług w pakiecie'}

─────────────────────────────────────────────────────────────
Szukasz innej wersji lub modelu? Zadzwoń do nas lub napisz! Przygotujemy ofertę indywidualną!
─────────────────────────────────────────────────────────────

Bawaria Motors to największy dealer marki BMW i MINI w Polsce, który od lat cieszy się uznaniem klientów dzięki najwyższej jakości usługom. Jako część Grupy Emil Frey, jednej z największych firm motoryzacyjnych na świecie, zapewniamy dostęp do najlepszych i najnowocześniejszych rozwiązań w branży.

Posiadamy pięć salonów rozlokowanych w całej Polsce: w Warszawie, Jankach, Piasecznie, Katowicach i Gdańsku, gdzie oferujemy nie tylko nowe i używane pojazdy marki BMW i MINI, ale również usługi serwisowe, blacharsko-lakiernicze oraz sklep z akcesoriami i częściami zamiennymi.

Nasz zespół specjalistów jest zawsze gotowy, aby sprostać wymaganiom i potrzebom naszych klientów. W Bawaria Motors kładziemy nacisk na najwyższą jakość obsługi i usług, aby zapewnić naszym klientom pełne zadowolenie z zakupów oraz serwisu.

Nasze wieloletnie doświadczenie na rynku motoryzacyjnym oraz wykorzystanie najnowszych technologii gwarantują najwyższą jakość i niezawodność usług. Pragniemy, aby nasze salony były miejscem, gdzie klienci czują się mile widziani i zawsze mogą liczyć na profesjonalną obsługę.

<b>Niniejsze ogłoszenie jest wyłącznie informacją handlową i nie stanowi oferty w myśl art. 66, § 1. Kodeksu Cywilnego. Sprzedający nie odpowiada za ewentualne błędy lub nieaktualność ogłoszenia.</b>`;
    };

    const handleCopy = async () => {
        const text = generateOtomotoText();
        
        try {
            // Zamiana znaczników nowej linii dla kopiowania jako Rich Text HTML do edytora Otomoto
            const htmlText = text.replace(/\n/g, '<br/>');
                
            const blobText = new Blob([text], { type: 'text/plain' });
            const blobHtml = new Blob([htmlText], { type: 'text/html' });
            
            const clipboardItem = new ClipboardItem({
                'text/plain': blobText,
                'text/html': blobHtml
            });
            
            await navigator.clipboard.write([clipboardItem]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Fallback for older browsers
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            Ładowanie danych auta...
        </div>;
    }

    if (!group) {
        return <div className="p-12 text-center text-red-500">Produkt nie odnaleziony.</div>;
    }

    const textToCopy = generateOtomotoText();

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin"
                    className="p-2 bg-white border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                        Generator Otomoto
                        <span className="px-2.5 py-1 rounded bg-[#E10514] text-white text-[10px] uppercase font-black tracking-widest leading-none">
                            Otomoto Helper
                        </span>
                    </h1>
                    <p className="text-sm text-gray-500">
                        {group.id} • Model: {group.model_code}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Management & Status */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Status Board */}
                    <div className="bg-white border rounded-sm p-6 shadow-sm">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#E10514]" />
                            Status Integracji
                        </h2>
                        
                        <div className="space-y-5">
                            <div className="animate-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                    URL Ogłoszenia na Otomoto
                                </label>
                                <input 
                                    type="url" 
                                    className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-[#E10514] transition-colors bg-gray-50"
                                    placeholder="https://www.otomoto.pl/osobowe/oferta/bmw..."
                                    value={otomotoUrl}
                                    onChange={(e) => setOtomotoUrl(e.target.value)}
                                />
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Wypełnienie tego pola automatycznie zabezpieczy grupę aut przed przypadkowym usunięciem w trakcie synchronizacji.
                                </p>
                                {otomotoUrl && (
                                    <a href={otomotoUrl} target="_blank" className="text-[10px] text-blue-600 font-bold uppercase mt-2 inline-flex items-center gap-1 hover:underline">
                                        Skocz do ogłoszenia <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>

                            <button
                                onClick={handleSaveStatus}
                                disabled={saving}
                                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white hover:bg-gray-800 transition-colors rounded-sm text-sm font-bold uppercase tracking-widest shadow-sm disabled:opacity-50"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Zapisz Status
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border rounded-sm p-6 shadow-sm">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-2">Multimedia</h2>
                        <p className="text-xs text-gray-500 mb-5">
                            Pobierz wszystkie połączone zdjęcia tego auta (z paczek firmowych oraz dealerowych) zoptymalizowane jako jeden plik `.zip`, gotowy do wgrania na Otomoto.
                        </p>

                        <button
                            onClick={downloadImagesZip}
                            disabled={downloadingZip}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 bg-white text-gray-900 hover:border-black hover:bg-gray-50 transition-colors rounded-sm text-sm font-bold shadow-sm disabled:opacity-50"
                        >
                            {downloadingZip ? <Loader2 className="w-4 h-4 animate-spin text-[#E10514]" /> : <Download className="w-4 h-4 text-[#E10514]" />}
                            {downloadingZip ? 'Pakowanie do ZIP...' : 'Pobierz Zdjęcia (ZIP)'}
                        </button>
                    </div>
                </div>

                {/* Right Column: Text Generator */}
                <div className="lg:col-span-8">
                    <div className="bg-white border rounded-sm p-0 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">Wygenerowany Opis</h2>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors rounded-sm text-xs font-bold uppercase tracking-wide"
                            >
                                {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Skopiowano!' : 'Kopiuj Tekst'}
                            </button>
                        </div>
                        <div className="flex-1 p-0 relative">
                            <textarea 
                                readOnly
                                value={textToCopy}
                                className="absolute inset-0 w-full h-full p-6 text-sm font-mono text-gray-800 bg-white resize-none focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
