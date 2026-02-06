import { supabase } from '@/lib/supabase';

export interface ServicePackage {
    code: string;
    name: string;
    type: 'BRI' | 'BSI' | 'BSI_PLUS';
    duration_months: number;
    mileage_limit: number;
    description?: string;
    plus: boolean;
}

export interface ServicePrice {
    id: string;
    package_code: string;
    series_code: string;
    price: number;
}

export interface EnrichedServicePackage extends ServicePackage {
    price?: number;
    is_base?: boolean; // If this is what comes with the car
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
    const { data, error } = await supabase
        .from('service_prices')
        .select('package_code, price')
        .eq('series_code', seriesCode);

    if (error) {
        console.error(`Error fetching prices for series ${seriesCode}:`, error);
        return {};
    }

    // Convert to map: code -> price
    const priceMap: Record<string, number> = {};
    data?.forEach((item) => {
        priceMap[item.package_code] = item.price;
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

export const upsertServicePrice = async (packageCode: string, seriesCode: string, price: number) => {
    // Note: We need an API route for this if RLS is strict, but assuming we use this in AdminAuth context
    // or we have a policy that allows writes.
    // Ideally we should use an API route for writes to keep keys secure if using service role.

    // For now, let's try direct client (works if RLS allows or Anon key has permissions as per migration comment)
    const { data, error } = await supabase
        .from('service_prices')
        .upsert(
            { package_code: packageCode, series_code: seriesCode, price },
            { onConflict: 'package_code, series_code' }
        )
        .select();

    if (error) throw error;
    return data;
};
