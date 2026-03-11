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
    const groups = await fetchAll('product_groups', '*');
    const cars = await fetchAll('stock_units', 'vin, model_code, color_code, individual_color, product_group_id');
    
    console.log("=== VERIFICATION OF 41HK ===");
    const cars41hk = cars.filter(c => c.model_code === '41HK');
    cars41hk.forEach(c => {
        const g = groups.find(g => g.id === c.product_group_id);
        console.log(`VIN ${c.vin}: Group ${g?.id}, Photos=${g?.images?.length || 0}`);
    });

    console.log("\n=== VERIFICATION OF INDIVIDUAL 490 ===");
    const cars490 = cars.filter(c => c.color_code === '490');
    console.log(`Found ${cars490.length} Individual 490 cars.`);
    cars490.forEach(c => {
        const g = groups.find(g => g.id === c.product_group_id);
        console.log(`VIN ${c.vin}: IndColor=${c.individual_color}, Photos=${g?.images?.length || 0}`);
    });

    const pending = cars.filter(c => {
        const g = groups.find(g => g.id === c.product_group_id);
        return !g?.images || g.images.length === 0;
    });
    console.log(`\nRemaining Cars in 'Pending Setup' (No Photos): ${pending.length} (out of ${cars.length} total)`);
}
run();
