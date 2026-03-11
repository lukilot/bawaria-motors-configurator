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
    console.log("Searching for double pipe signatures in product_groups...");
    const groups = await fetchAll('product_groups', '*');
    
    const doublePipeGroups = groups.filter(g => g.signature.includes('||'));
    console.log(`Found ${doublePipeGroups.length} groups with '||' in signature.`);
    
    for (const g of doublePipeGroups) {
        if (g.images && g.images.length > 0) {
            console.log(`\nGroup with pics AND ||: ${g.id}`);
            console.log(`Model/Color: ${g.model_code} / ${g.color_code}`);
            console.log(`Signature: ${g.signature}`);
            console.log(`Pics: ${g.images.length}`);
        }
    }
}
run();
