import { supabase } from './supabase';
import { StockCar } from '@/types/stock';

function generateProductSignature(car: StockCar): string {
    const rawOptions = (car.option_codes || []).map(c => c.trim().toUpperCase()).sort().join('|');
    const individualColor = car.individual_color?.trim().toUpperCase() || '';

    // Historical signature format: Model | Color | IndividualColor | Upholstery | Options | Year
    // CRITICAL: For 490 (BMW Individual Paint) cars, we MUST NOT group them together automatically.
    // Even if two 490 cars have identical options and upholstery, they might be painted completely different custom colors.
    // To enforce this isolation, whenever a car has a '490' color code, we inject its VIN into the signature.
    // This forces 490 cars into entirely isolated product groups mapping 1-to-1 to the VIN.
    const isIndividual = car.color_code === '490';
    const colorSegment = isIndividual ? `490|${car.vin}` : `${car.color_code}|${individualColor}`;

    const content = `${car.model_code}|${colorSegment}|${car.upholstery_code}|${rawOptions}|${car.production_date ? new Date(car.production_date).getFullYear() : '0'}`;
    return content;
}

export const syncStockToSupabase = async (cars: StockCar[], source: string = 'Bawaria Motors') => {
    if (!cars || cars.length === 0) return { success: true, count: 0 };

    // 0. Fetch existing DB records to preserve manual overrides like `individual_color`
    // BMW Excel often lacks Individual paint codes, so if they were manually decoded/entered, we must preserve them to prevent merging!
    const incomingVins = cars.map(c => c.vin);
    const existingColors = new Map<string, string>();

    // Batch fetch incoming VINs to prevent HeadersOverflowError (URI too long)
    const BATCH_SIZE = 500;
    const existingCarsInfo = new Map<string, any>();

    for (let i = 0; i < incomingVins.length; i += BATCH_SIZE) {
        const chunk = incomingVins.slice(i, i + BATCH_SIZE);
        const { data: chunkCars, error } = await supabase
            .from('stock_units')
            .select('vin, individual_color, option_codes, product_group_id')
            .in('vin', chunk);

        if (!error && chunkCars) {
            chunkCars.forEach(c => {
                if (c.individual_color) existingColors.set(c.vin, c.individual_color);
                existingCarsInfo.set(c.vin, c);
            });
        }
    }

    // 0b. Fetch ALL existing product_groups to preserve their images + manual_price
    // Key: model_code|color_code|upholstery_code -> { images, manual_price, id }
    const allGroups: any[] = [];
    let page = 0;
    const PAGE_SIZE = 1000;
    while (true) {
        const { data } = await supabase
            .from('product_groups')
            .select('id, model_code, color_code, upholstery_code, images, manual_price, signature')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (data) allGroups.push(...data);
        if (!data || data.length < PAGE_SIZE) break;
        page++;
    }
    const existingGroups = allGroups;

    // Build lookup maps for groups
    const existingGroupMap = new Map<string, { images: string[] | null; manual_price: number | null; id: string }>();
    const groupIdToGroupMap = new Map<string, { images: string[] | null; manual_price: number | null; signature: string }>();

    existingGroups?.forEach((g: any) => {
        if ((g.images && g.images.length > 0) || g.manual_price) {
            existingGroupMap.set(g.signature, { images: g.images, manual_price: g.manual_price, id: g.id });
        }
        groupIdToGroupMap.set(g.id, { images: g.images, manual_price: g.manual_price, signature: g.signature });
    });

    const signatures = new Set<string>();
    const groupsToUpsert: any[] = [];
    const carSignatures = new Map<string, string>(); // VIN -> Signature

    cars.forEach(car => {
        // Inject preserved individual color if it exists in DB. 
        // Excel often contains '490' but not the name. Manual overrides must be protected
        // to prevent the signature from changing and losing photo links.
        if (existingColors.has(car.vin)) {
            car.individual_color = existingColors.get(car.vin);
        }

        const sig = generateProductSignature(car);
        carSignatures.set(car.vin, sig);

        if (!signatures.has(sig)) {
            signatures.add(sig);

            const existing = existingGroupMap.get(sig);

            // ONLY use images if this exact signature already had them. No rescuing.
            const finalImages = existing?.images;

            groupsToUpsert.push({
                signature: sig,
                model_code: car.model_code,
                color_code: car.color_code,
                upholstery_code: car.upholstery_code,
                option_codes: car.option_codes,
                production_year: car.production_date ? new Date(car.production_date).getFullYear() : new Date().getFullYear(),
                updated_at: new Date().toISOString(),
                // Preserve or Rescue images
                ...(finalImages && finalImages.length > 0 ? { images: finalImages } : {}),
                ...(existing?.manual_price ? { manual_price: existing.manual_price } : {}),
            });
        }
    });

    // 2. Upsert Product Groups
    const { data: groups, error: groupError } = await supabase
        .from('product_groups')
        .upsert(groupsToUpsert, { onConflict: 'signature' })
        .select('id, signature');

    if (groupError) throw new Error('Group Sync Failed: ' + groupError.message);

    const signatureToId = new Map<string, string>();
    groups?.forEach((g: any) => signatureToId.set(g.signature, g.id));

    // 3. Prepare Stock Units with Group ID
    const dbRows = cars.map(car => {
        const sig = carSignatures.get(car.vin)!;
        const groupId = signatureToId.get(sig);

        const row: any = {
            vin: car.vin,
            product_group_id: groupId,
            status_code: car.status_code,
            order_status: car.order_status,
            processing_type: car.processing_type,
            reservation_details: car.reservation_details,
            model_code: car.model_code,
            model_name: car.model_name,
            body_group: car.body_group,
            color_code: car.color_code,
            individual_color: car.individual_color, // Explicitly preserve manual color
            upholstery_code: car.upholstery_code,
            fuel_type: car.fuel_type,
            power: car.power,
            drivetrain: car.drivetrain,
            option_codes: car.option_codes,
            currency: car.currency,
            visibility: car.visibility,
            production_date: car.production_date ? new Date(car.production_date).toISOString() : null,
            last_synced_at: new Date().toISOString(),
            source: source
        };

        if (car.list_price > 0) {
            row.list_price = car.list_price;
        }

        return row;
    });

    const deduped = [...new Map(dbRows.map(r => [r.vin, r])).values()];

    const { error, count } = await supabase
        .from('stock_units')
        .upsert(deduped, {
            onConflict: 'vin',
            ignoreDuplicates: false
        })
        .select();

    if (error) {
        throw new Error(error.message);
    }

    // 4. Record Option Changes to sync_logs
    const logsToInsert: any[] = [];
    deduped.forEach(car => {
        const oldCar = existingCarsInfo.get(car.vin);
        if (oldCar && oldCar.option_codes) {
            // Compare old vs new
            const oldOpts = new Set<string>(oldCar.option_codes);
            const newOpts = new Set<string>(car.option_codes || []);

            const added = (car.option_codes || []).filter((c: string) => !oldOpts.has(c));
            const removed = (oldCar.option_codes || []).filter((c: string) => !newOpts.has(c));

            if (added.length > 0 || removed.length > 0) {
                logsToInsert.push({
                    vin: car.vin,
                    model_code: car.model_code,
                    model_name: car.model_name,
                    color_code: car.color_code,
                    upholstery_code: car.upholstery_code,
                    added_options: added,
                    removed_options: removed,
                    resolved: false
                });
            }
        }
    });

    if (logsToInsert.length > 0) {
        // Silently execute insert to not break sync if the table doesn't exist yet
        try {
            await supabase.from('sync_logs').insert(logsToInsert);
        } catch (e) {
            console.error('Failed to write sync logs (does the table exist?)', e);
        }
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
            visibility: 'HIDDEN',
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
