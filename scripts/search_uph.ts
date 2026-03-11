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
    console.log("Searching for ANY product groups with upholstery X3AT and photos...");
    const groups = await fetchAll('product_groups', '*');
    const matches = groups.filter(g => g.upholstery_code === 'X3AT' && g.images && g.images.length > 0);
    
    if (matches.length === 0) {
        console.log("No groups found with X3AT and photos.");
    } else {
        matches.forEach(g => {
            console.log(`- ${g.id}: Model=${g.model_code}, Color=${g.color_code}, Pics=${g.images.length}`);
            console.log(`  Sig: ${g.signature}`);
        });
    }

    console.log("\nSearching for ANY group with 'CS' in the signature...");
    const csMatches = groups.filter(g => g.signature.includes('CS') && g.images && g.images.length > 0);
    csMatches.forEach(g => {
        console.log(`- ${g.id}: Model=${g.model_code}, Pics=${g.images.length}, Sig=${g.signature}`);
    });
}
run();
