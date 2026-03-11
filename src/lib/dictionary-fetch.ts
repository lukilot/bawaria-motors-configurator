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
    const { data, error } = await supabase
        .from('dictionaries')
        .select('*');

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

    if (error) {
        console.error('Error fetching all dictionaries:', error);
        return defaults;
    }

    return data.reduce((acc: any, item: any) => {
        if (!acc[item.type]) acc[item.type] = {};

        // For options with body groups, store as array to handle multiple variants
        if (item.type === 'option' && item.data.body_groups && item.data.body_groups.length > 0) {
            if (!acc[item.type][item.code]) {
                acc[item.type][item.code] = [];
            }
            // Store as array if not already
            if (Array.isArray(acc[item.type][item.code])) {
                acc[item.type][item.code].push(item.data);
            } else {
                // Convert existing single entry to array
                acc[item.type][item.code] = [acc[item.type][item.code], item.data];
            }
        } else {
            // For non-body-group options or other types, store normally
            // But check if there's already an array (body-group variant exists)
            if (Array.isArray(acc[item.type][item.code])) {
                acc[item.type][item.code].push(item.data);
            } else {
                acc[item.type][item.code] = item.data;
            }
        }

        return acc;
    }, defaults);
}

export function resolveDictionaryEntry(code: string, dictionaries: any, type: DictionaryItem['type'], bodyGroup?: string) {
    const entry = dictionaries[type][code];
    if (!entry) return undefined;

    const findBestData = (dataOrArray: any) => {
        if (!Array.isArray(dataOrArray)) {
            // Check if there are variations defined in a single object (deprecated but for safety)
            if (dataOrArray.variations && bodyGroup) {
                const variation = dataOrArray.variations.find((v: any) =>
                    v.body_groups && v.body_groups.includes(bodyGroup)
                );
                if (variation) return variation;
            }
            return dataOrArray;
        }

        if (bodyGroup) {
            const match = dataOrArray.find((data: any) =>
                data.body_groups && Array.isArray(data.body_groups) && data.body_groups.includes(bodyGroup)
            );
            if (match) return match;
        }

        // Return generic or first
        return dataOrArray.find((data: any) => !data.body_groups || data.body_groups.length === 0) || dataOrArray[0];
    };

    const bestData = findBestData(entry);
    return {
        ...bestData,
        image: bestData?.image || bestData?.image_url
    };
}
