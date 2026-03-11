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
    console.log("Listing ALL orphaned groups with images...");
    const groups = await fetchAll('product_groups', '*');
    const cars = await fetchAll('stock_units', 'product_group_id');
    const linkedGroupIds = new Set(cars.map(c => c.product_group_id));

    const orphans = groups.filter(g => g.images && g.images.length > 0 && !linkedGroupIds.has(g.id));
    console.log(`Found ${orphans.length} orphans with photos.\n`);

    for (const o of orphans) {
        console.log(`ID: ${o.id}, Model: ${o.model_code}, Color: ${o.color_code}, Uph: ${o.upholstery_code}, Pics: ${o.images.length}`);
    }
}
run();
