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
    console.log("Listing ALL models that have ANY photos in product_groups with their description/name...");
    const groups = await fetchAll('product_groups', 'id, model_code, images, description');
    
    // We also need model names from stock_units because product_groups might not have them
    const cars = await fetchAll('stock_units', 'model_code, model_name');
    const modelToName = new Map();
    cars.forEach(c => modelToName.set(c.model_code, c.model_name));

    const modelCounts = new Map();
    for (const g of groups) {
        if (g.images && g.images.length > 0) {
            const current = modelCounts.get(g.model_code) || { count: 0, ids: [] };
            current.count++;
            current.ids.push(g.id);
            modelCounts.set(g.model_code, current);
        }
    }

    for (const [code, info] of modelCounts.entries()) {
        console.log(`Code: ${code}, Name: ${modelToName.get(code) || 'N/A'}, Count: ${info.count}`);
    }
}
run();
