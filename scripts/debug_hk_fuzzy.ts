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
    const cars = await fetchAll('stock_units', 'vin, product_group_id, model_code, color_code, upholstery_code');

    const groupToVins: Record<string, any[]> = {};
    for (const car of cars) {
        if (car.product_group_id) {
            if (!groupToVins[car.product_group_id]) groupToVins[car.product_group_id] = [];
            groupToVins[car.product_group_id].push(car);
        }
    }

    const orphans = groups.filter(g => g.images && g.images.length > 0 && (!groupToVins[g.id] || groupToVins[g.id].length === 0));
    const emptyTargets = groups.filter(g => (!g.images || g.images.length === 0) && groupToVins[g.id] && groupToVins[g.id].length > 0);

    console.log("Analyzing 41HK targets...");
    const target41hk = emptyTargets.filter(t => t.model_code === '41HK');
    
    for (const target of target41hk) {
        console.log(`\nTarget Group ${target.id} (Model: ${target.model_code}, Color: ${target.color_code}, Uph: ${target.upholstery_code})`);
        
        const suffix = target.model_code.slice(-2);
        const candidates = orphans.filter(o => o.model_code.endsWith(suffix));
        console.log(`  Orphans found with suffix ${suffix}: ${candidates.length}`);
        
        candidates.forEach(o => {
            console.log(`    - Orphan ${o.id}: Model=${o.model_code}, Color=${o.color_code}, Uph=${o.upholstery_code}`);
        });
    }
}
run();
