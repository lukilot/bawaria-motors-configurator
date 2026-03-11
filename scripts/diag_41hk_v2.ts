import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach((line: string) => {
    const [key, ...val] = line.split('=');
    if (key && val) env[key.trim()] = val.join('=').trim();
});
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function fetchAll(table: string, columns: string) {
    const results: any[] = [];
    let page = 0;
    while (true) {
        const { data, error } = await supabase.from(table).select(columns).range(page * 1000, (page + 1) * 1000 - 1);
        if (error) throw error;
        if (data) results.push(...data);
        if (!data || data.length < 1000) break;
        page++;
    }
    return results;
}

async function run() {
    console.log("Deep analysis of 41HK...");

    const groups = await fetchAll('product_groups', '*');
    const cars = await fetchAll('stock_units', '*');

    const cars41HK = cars.filter(c => c.model_code === '41HK');
    console.log(`\nFound ${cars41HK.length} cars with model 41HK in DB.`);

    for (const car of cars41HK) {
        console.log(`\nVIN: ${car.vin}`);
        console.log(`Current Group ID: ${car.product_group_id}`);
        const group = groups.find(g => g.id === car.product_group_id);
        console.log(`Current Group Photos: ${group?.images?.length || 0}`);
        console.log(`Current Group Signature: ${group?.signature}`);

        // Find ALL groups matching this model/color
        const matchingGroups = groups.filter(g => g.model_code === '41HK' && g.color_code === car.color_code);
        console.log(`Matching Groups for this model/color in DB: ${matchingGroups.length}`);
        matchingGroups.forEach(mg => {
            const carCount = cars.filter(c => c.product_group_id === mg.id).length;
            console.log(`  - Group ${mg.id}: ${mg.images?.length || 0} pics, ${carCount} cars linked, Sig: ${mg.signature.slice(0, 100)}...`);
        });
    }

    console.log("\nDeep analysis of Color 490...");
    const cars490 = cars.filter(c => c.color_code === '490');
    console.log(`Found ${cars490.length} cars with color 490.`);
    cars490.slice(0, 5).forEach(car => {
        console.log(`VIN: ${car.vin}, Individual: ${car.individual_color}, Group ID: ${car.product_group_id}`);
    });
}
run();
