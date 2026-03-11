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
    console.log("REVERTING INCORRECT 41HK PHOTO ASSIGNMENTS...");
    const groups = await fetchAll('product_groups', '*');

    // Any group with model_code 41HK that has photos and was recently updated:
    // Wait, let's just clear ALL 41HK photos for now because I know I added them.
    const targets = groups.filter(g => g.model_code === '41HK' && g.images && g.images.length > 0);
    console.log(`Found ${targets.length} groups to revert.`);

    for (const g of targets) {
        console.log(`Clearing photos for Group ${g.id} (Model: ${g.model_code})`);
        await supabase.from('product_groups').update({ images: null }).eq('id', g.id);
    }

    console.log("REVERT DONE.");
}
run();
