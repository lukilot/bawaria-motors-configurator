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
    console.log("Searching for ANY product groups with M-specific options and photos...");
    const groups = await fetchAll('product_groups', 'id, model_code, images, option_codes, signature');
    
    // Search for options like 7ME (M Driver's Package), 7MA (Competition)
    const mGroups = groups.filter(g => g.images && g.images.length > 0 && 
        (g.option_codes?.includes('7ME') || g.option_codes?.includes('7MA') || g.signature.includes('7ME') || g.signature.includes('7MA')));

    console.log(`Found ${mGroups.length} groups with photos and 7ME/7MA.`);
    mGroups.forEach(g => {
        console.log(`- ${g.id}: Model=${g.model_code}, Pics=${g.images.length}`);
    });

    // Also look for groups that have "M4 CS" in their model name in the database
    // Wait, the group table doesn't have model_name. I need to join with stock_units.
    const { data: cars } = await supabase.from('stock_units').select('model_code, model_name, product_group_id').ilike('model_name', '%M4 CS%');
    console.log("\nCars with 'M4 CS' in name:");
    cars?.forEach(c => {
        const g = groups.find(g2 => g2.id === c.product_group_id);
        console.log(`- Model=${c.model_code}, Name=${c.model_name}, Pics=${g?.images?.length || 0}`);
    });
}
run();
