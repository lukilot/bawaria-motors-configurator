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
    console.log("Searching for ANY product groups that might have M4 CS photos...");
    const groups = await fetchAll('product_groups', '*');
    
    // Search by description if it contains M4 CS
    const matchDesc = groups.filter(g => g.description?.includes('M4 CS'));
    console.log(`Groups with 'M4 CS' in description: ${matchDesc.length}`);
    matchDesc.forEach(g => {
        console.log(`- ${g.id}: Model=${g.model_code}, Photos=${g.images?.length || 0}`);
    });

    // List ALL groups with photos and check their signatures for anything suspicious
    const groupsWithPhotos = groups.filter(g => g.images && g.images.length > 0);
    console.log(`\nTotal groups with photos: ${groupsWithPhotos.length}`);
    
    // Look for any group that has a LOT of photos (maybe a CS set?)
    // Or groups with model codes that start with 4
    const series4 = groupsWithPhotos.filter(g => g.model_code.startsWith('4'));
    console.log(`\nGroups with photos and model code starting with 4:`);
    series4.forEach(g => {
        console.log(`- ${g.id}: Model=${g.model_code}, Color=${g.color_code}, Uph=${g.upholstery_code}, Pics=${g.images.length}`);
        console.log(`  Sig: ${g.signature}`);
    });
}
run();
