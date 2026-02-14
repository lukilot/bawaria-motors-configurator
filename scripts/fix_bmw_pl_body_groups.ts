
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Use Service Role Key for updates if possible, otherwise Anon.
// Note: Anon usually cannot update tables unless RLS allows it.
// Since previous script worked, I assume specific RLS policies are in place or I have rights.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- Fixing BMW PL Body Groups (Dynamic Lookup) ---');

    console.log('Fetching Bawaria Motors cars to build reference map...');
    // 1. Fetch Bawaria Motors cars to build a reference map
    const { data: bawariaCars, error: bawariaError } = await supabase
        .from('stock_units')
        .select('model_code, body_group')
        .eq('source', 'Bawaria Motors')
        .not('model_code', 'is', null)
        .not('body_group', 'is', null)
        .limit(5000); // Fetch enough to cover unique models

    if (bawariaError) {
        console.error('Error fetching Bawaria cars:', bawariaError);
        return;
    }

    // Build unique map
    const referenceMap = new Map<string, string>();
    bawariaCars.forEach(car => {
        // Simple heuristic: body_group should be 3 chars (e.g. G60), not "520"
        if (car.model_code && car.body_group && car.body_group.length === 3) {
            referenceMap.set(car.model_code, car.body_group);
        }
    });

    console.log(`Built reference map with ${referenceMap.size} unique codes.`);

    // Log some examples
    // console.log('Examples:', [...referenceMap.entries()].slice(0, 5));

    // 2. Fetch BMW PL cars (or all non-Bawaria)
    const { data: plCars, error: plError } = await supabase
        .from('stock_units')
        .select('vin, model_code, body_group, source')
        .neq('source', 'Bawaria Motors');

    if (plError) {
        console.error('Error fetching PL cars:', plError);
        return;
    }

    console.log(`Checking ${plCars.length} BMW PL cars...`);

    let updatedCount = 0;
    let skippedCount = 0;
    let unknownCount = 0;

    for (const car of plCars) {
        const correctCode = referenceMap.get(car.model_code);

        // Update if we have a match and it's different (and valid)
        if (correctCode) {
            if (car.body_group !== correctCode) {
                console.log(`Updating ${car.vin} (${car.model_code}): "${car.body_group}" -> "${correctCode}"`);

                const { error: updateError } = await supabase
                    .from('stock_units')
                    .update({ body_group: correctCode })
                    .eq('vin', car.vin);

                if (updateError) {
                    console.error(`Failed to update ${car.vin}:`, updateError);
                } else {
                    updatedCount++;
                }
            } else {
                skippedCount++;
            }
        } else {
            console.warn(`UNKNOWN CODE: ${car.model_code} (Current: ${car.body_group})`);
            unknownCount++;
        }
    }

    console.log(`\nDone. Updated: ${updatedCount}, Skipped (Already Correct): ${skippedCount}, Unknowns: ${unknownCount}`);
}

main();
