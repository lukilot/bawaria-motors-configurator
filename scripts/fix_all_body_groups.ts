
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to parse MODEL_MAP from the file content directly
// (avoiding import issues with aliases in standalone scripts)
function getModelMap() {
    const filePath = path.resolve(process.cwd(), 'src/lib/model-attributes.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    // Simple regex to extract key-values
    // const MODEL_MAP: Record<string, ModelAttributes> = {
    //    'CODE': { ... },
    // };

    const lines = content.split('\n');
    const map: Record<string, any> = {};

    lines.forEach(line => {
        const match = line.match(/^\s*'([A-Z0-9]+)':\s*{\s*(.+)\s*},/);
        if (match) {
            const code = match[1];
            const propsStr = match[2];

            // Extract body_group
            const bgMatch = propsStr.match(/body_group:\s*'([^']+)'/);
            if (bgMatch) {
                map[code] = bgMatch[1];
            }
        }
    });

    return map;
}

async function main() {
    console.log('Starting global body_group fix...');

    const modelMap = getModelMap();
    console.log(`Loaded ${Object.keys(modelMap).length} models from library.`);

    // 1. Fetch all cars
    // 1. Fetch all cars with pagination
    let allCars: any[] = [];
    let from = 0;
    const batchSize = 1000;
    let more = true;

    while (more) {
        console.log(`Fetching batch ${from} - ${from + batchSize - 1}...`);
        const { data: batch, error } = await supabase
            .from('stock_units')
            .select('vin, model_code, body_group')
            .not('model_code', 'is', null)
            .range(from, from + batchSize - 1);

        if (error) {
            console.error('Error fetching cars:', error);
            break;
        }

        if (batch && batch.length > 0) {
            allCars = [...allCars, ...batch];
            if (batch.length < batchSize) {
                more = false;
            } else {
                from += batchSize;
            }
        } else {
            more = false;
        }
    }

    const cars = allCars;

    if (cars.length === 0) {
        console.log('No cars found.');
        return;
    }

    console.log(`Checking ${cars.length} cars...`);

    let updatedCount = 0;

    for (const car of cars) {
        const correctGroup = modelMap[car.model_code];

        if (correctGroup) {
            // If current group is missing OR different from correct group
            // Note: We trust the library mapping over the DB value now, 
            // especially since DB has values like '420' which are invalid.
            if (!car.body_group || car.body_group !== correctGroup) {

                // Extra check: If DB has a value, is it plausible? 
                // e.g. if DB says G22 and library says G22, we skip.
                // if DB says M44 and library says G22, we update.

                console.log(`Updating ${car.vin} (${car.model_code}): ${car.body_group} -> ${correctGroup}`);

                const { error: updateError } = await supabase
                    .from('stock_units')
                    .update({ body_group: correctGroup })
                    .eq('vin', car.vin);

                if (updateError) {
                    console.error(`Failed to update ${car.vin}:`, updateError);
                } else {
                    updatedCount++;
                }
            }
        } else {
            // console.warn(`Model Code ${car.model_code} not found in library.`);
        }
    }

    console.log(`Finished. Updated ${updatedCount} cars.`);
}

main();
