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
    const cars = await fetchAll('stock_units', '*');
    
    const cars41HK = cars.filter(c => c.model_code === '41HK');
    console.log(`Analyzing ${cars41HK.length} cars of model 41HK...`);
    
    for (const car of cars41HK) {
        const currentG = groups.find(g => g.id === car.product_group_id);
        if (currentG?.images && currentG.images.length > 0) {
            console.log(`VIN ${car.vin} OK: Group ${currentG.id} has ${currentG.images.length} pics.`);
            continue;
        }
        
        console.log(`VIN ${car.vin} MISSING PHOTOS. Searching siblings...`);
        // Search siblings: same color and upholstery in ANY model that starts with '4' or '3' (M3/M4)
        const candidates = groups.filter(g => 
            g.images && g.images.length > 0 && 
            g.color_code === car.color_code && 
            g.upholstery_code === car.upholstery_code &&
            (g.model_code.startsWith('4') || g.model_code.startsWith('3'))
        );
        
        if (candidates.length > 0) {
            console.log(`  Found ${candidates.length} candidate groups with photos!`);
            candidates.forEach(cnd => {
                console.log(`    - Group ${cnd.id} (Model: ${cnd.model_code}, Pics: ${cnd.images.length})`);
            });
        } else {
            console.log(`  No candidate groups found for Color ${car.color_code} / Uph ${car.upholstery_code}.`);
        }
    }
}
run();
