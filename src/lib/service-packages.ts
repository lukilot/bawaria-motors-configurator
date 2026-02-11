import { supabase } from '@/lib/supabase';

export interface ServicePackage {
    id: string; // UUID
    code: string;
    name: string;
    type: 'BRI' | 'BSI' | 'BSI_PLUS';
    duration_months: number;
    mileage_limit: number;
    description?: string;
    plus: boolean;
    vehicle_type: 'ALL' | 'ELECTRIC' | 'ICE_PHEV';
}

export interface ServicePrice {
    id: string;
    package_id: string; // Changed from package_code
    series_code: string;
    price: number;
    // Helper for UI join, might be null if raw fetch
    package_code?: string;
}

export interface EnrichedServicePackage extends ServicePackage {
    price?: number;
    is_base?: boolean;
}

export const getServicePackages = async (): Promise<ServicePackage[]> => {
    const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .order('duration_months', { ascending: true })
        .order('mileage_limit', { ascending: true });

    if (error) {
        console.error('Error fetching service packages:', error);
        return [];
    }
    return data || [];
};

export const getServicePrices = async (seriesCode: string): Promise<Record<string, number>> => {
    // We need to return package_code -> price mapping for the Configurator?
    // Wait config uses IDs now? Or still Codes?
    // The Configurator knows "7CH".
    // It filters packages to find the one matching "7CH" AND fuelType.
    // That package has an ID.
    // So we need Price by Package ID.

    // Let's return package_id -> price map.
    const { data, error } = await supabase
        .from('service_prices')
        .select('package_id, price')
        .eq('series_code', seriesCode);

    if (error) {
        console.error(`Error fetching prices for series ${seriesCode}:`, error);
        return {};
    }

    // Convert to map: package_id -> price
    const priceMap: Record<string, number> = {};
    data?.forEach((item) => {
        priceMap[item.package_id] = item.price;
    });

    return priceMap;
};

// For Admin: Fetch all prices
export const getAllServicePrices = async (): Promise<ServicePrice[]> => {
    const { data, error } = await supabase
        .from('service_prices')
        .select('*')
        .order('series_code', { ascending: true });

    if (error) {
        console.error('Error fetching all prices:', error);
        return [];
    }
    return data || [];
};

export const upsertServicePrice = async (packageId: string, seriesCode: string, price: number) => {
    // Note: We need an API route for this if RLS is strict, but assuming we use this in AdminAuth context
    // or we have a policy that allows writes.
    // Ideally we should use an API route for writes to keep keys secure if using service role.

    // For now, let's try direct client (works if RLS allows or Anon key has permissions as per migration comment)
    const { data, error } = await supabase
        .from('service_prices')
        .upsert(
            { package_id: packageId, series_code: seriesCode, price },
            { onConflict: 'package_id, series_code' } // Need to verify constraint name?
            // Actually, we should check if constraints exist
        )
        .select();

    if (error) throw error;
    return data;
};
