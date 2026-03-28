import { supabase } from './supabase';

export interface DictionaryItem {
    type: 'model' | 'color' | 'upholstery' | 'option' | 'package';
    code: string;
    data: any;
}

export async function getDictionary(type: DictionaryItem['type']) {
    const { data, error } = await supabase
        .from('dictionaries')
        .select('*')
        .eq('type', type);

    if (error) {
        console.error(`Error fetching ${type} dictionary:`, error);
        return {};
    }

    // Return as a map for O(1) lookup
    return data.reduce((acc: Record<string, any>, item: any) => {
        acc[item.code] = item.data;
        return acc;
    }, {});
}

export async function getAllDictionaries() {
    let allData: any[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('dictionaries')
            .select('*')
            .range(from, from + batchSize - 1);

        if (error) {
            console.error('Error fetching dictionaries batch:', error);
            break;
        }

        if (!data || data.length === 0) break;
        allData.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
    }

    const defaults = {
        model: {},
        color: {},
        upholstery: {},
        option: {},
        drivetrain: {
            'FWD': { name: 'Na przednią oś' },
            'RWD': { name: 'Na tylną oś' },
            'AWD': { name: 'xDrive (AWD)' },
            'xDrive': { name: 'xDrive (AWD)' },
            'sDrive': { name: 'sDrive' }
        }
    };

    if (allData.length === 0) return defaults;

    return allData.reduce((acc: any, item: any) => {
        if (!acc[item.type]) acc[item.type] = {};

        // For options with body groups, store as array to handle multiple variants
        // (Legacy check for multiple rows, though unique constraint should prevent this now)
        if (item.type === 'option' && item.data.body_groups && item.data.body_groups.length > 0) {
            if (!acc[item.type][item.code]) {
                acc[item.type][item.code] = [];
            }
            if (Array.isArray(acc[item.type][item.code])) {
                acc[item.type][item.code].push(item.data);
            } else {
                acc[item.type][item.code] = [acc[item.type][item.code], item.data];
            }
        } else {
            if (Array.isArray(acc[item.type][item.code])) {
                acc[item.type][item.code].push(item.data);
            } else {
                acc[item.type][item.code] = item.data;
            }
        }

        return acc;
    }, defaults);
}

export function resolveDictionaryEntry(
    code: string, 
    dictionaries: any, 
    type: DictionaryItem['type'], 
    bodyGroup?: string,
    strictOptionContext: boolean = false
) {
    if (!code) return undefined;

    // Jeżeli pytamy o opcję, ale nie w ścisłym kontekście (strictOptionContext = false)
    // to dla kodów które w BMW występują podwójnie (szczególnie jako lakiery, np. 300 - Biel Alpejska vs 300 - Koło zapasowe)
    // wymuszamy undefined, aby mechanizm spadł (fallback) do szukania w słowniku 'color'.
    if (type === 'option' && !strictOptionContext) {
        if (['300', '337', '490', '430'].includes(code)) {
            return undefined;
        }
    }

    const entry = dictionaries[type]?.[code];
    if (!entry) return undefined;

    const findBestData = (dataOrArray: any) => {
        const baseData = Array.isArray(dataOrArray) ? dataOrArray[0] : dataOrArray;
        if (!baseData) return undefined;

        // If we have specific variations, look for a match
        if (baseData.variations && Array.isArray(baseData.variations) && bodyGroup) {
            const variant = baseData.variations.find((v: any) =>
                v.body_groups && Array.isArray(v.body_groups) && v.body_groups.includes(bodyGroup)
            );
            // MERGE variation into base data to avoid losing name/marketing info
            if (variant) {
                const merged = { ...baseData, ...variant };
                return merged;
            }
        }

        return baseData;
    };

    const bestData = findBestData(entry);
    if (!bestData) return undefined;

    const resolved = {
        ...bestData,
        image: bestData.image || bestData.image_url
    };

    // Hardcode overrides for known BMW overlaps between Paint and Option codes
    if (type === 'option' && strictOptionContext) {
        if (code === '337') {
            resolved.name = 'Pakiet sportowy M';
        } else if (code === '300') {
            resolved.name = 'Koło zapasowe';
        } else if (code === '490') {
            resolved.name = 'Regulacja szerokości oparcia foteli przednich';
        } else if (code === '430') {
            resolved.name = 'Pakiet dodatkowych funkcji lusterek';
        }
    }

    return resolved;
}
