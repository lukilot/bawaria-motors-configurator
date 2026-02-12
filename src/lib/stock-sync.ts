import { supabase } from './supabase';
import { StockCar } from '@/types/stock';

export const syncStockToSupabase = async (cars: StockCar[], source: string = 'Bawaria Motors') => {
    if (!cars || cars.length === 0) return { success: true, count: 0 };

    // Prepare data for upsert
    const dbRows = cars.map(car => {
        const row: any = {
            vin: car.vin,
            status_code: car.status_code,
            order_status: car.order_status,
            processing_type: car.processing_type,
            reservation_details: car.reservation_details,
            model_code: car.model_code,
            model_name: car.model_name,
            body_group: car.body_group,
            color_code: car.color_code,
            upholstery_code: car.upholstery_code,
            fuel_type: car.fuel_type,
            power: car.power,
            drivetrain: car.drivetrain,
            option_codes: car.option_codes,
            currency: car.currency,
            visibility: car.visibility,
            production_date: car.production_date ? new Date(car.production_date).toISOString() : null,
            last_synced_at: new Date().toISOString(),
            source: source // Add source field here
        };

        if (car.list_price > 0) {
            row.list_price = car.list_price;
        }

        return row;
    });

    // Perform Upsert
    const { error, count } = await supabase
        .from('stock_units')
        .upsert(dbRows, {
            onConflict: 'vin',
            ignoreDuplicates: false
        })
        .select();

    if (error) {
        throw new Error(error.message);
    }

    return { success: true, count };
};

export const analyzeStockDiff = async (newCars: StockCar[], source: string = 'Bawaria Motors') => {
    // 1. Get all currently ACTIVE cars (not Sold/Archived) for THIS SOURCE only
    // This prevents wiping BMW PL cars when syncing Bawaria cars, and vice versa.
    const { data: activeCars, error } = await supabase
        .from('stock_units')
        .select('*')
        .lt('status_code', 500)
        .eq('source', source); // Scope check to source

    if (error) throw error;
    if (!activeCars) return [];

    const newVins = new Set(newCars.map(c => c.vin));

    // Find cars in DB (for this source) that are NOT in the new file
    const missingCars = activeCars.filter(car => !newVins.has(car.vin));

    return missingCars;
};

export const markCarsAsSold = async (vins: string[]) => {
    if (vins.length === 0) return { count: 0 };

    const { error: updateError, count } = await supabase
        .from('stock_units')
        .update({
            status_code: 500,
            order_status: 'Sprzedany / Wycofany',
            visibility: 'SOLD',
            last_synced_at: new Date().toISOString()
        })
        .in('vin', vins)
        .select('*');

    if (updateError) throw updateError;

    return { count: count || vins.length };
};

export const deleteCarPermanently = async (vin: string) => {
    try {
        await fetch('/api/admin/purge-images', {
            method: 'POST',
            body: JSON.stringify({ vin }),
        });
    } catch (e) {
        console.error(`Failed to purge images for ${vin}`, e);
    }

    const { error } = await supabase
        .from('stock_units')
        .delete()
        .eq('vin', vin);

    if (error) throw error;

    return true;
};
