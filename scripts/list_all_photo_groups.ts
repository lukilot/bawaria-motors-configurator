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
    const PAGE_SIZE = 1000;
    while (true) {
        const { data, error } = await supabase.from(table).select(columns).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (error) throw error;
        if (data) results.push(...data);
        if (!data || data.length < PAGE_SIZE) break;
        page++;
    }
    return results;
}

async function run() {
    const groups = await fetchAll('product_groups', '*');
    const photoGroups = groups.filter(g => Array.isArray(g.images) && g.images.length > 0);

    console.log(`Listing ${photoGroups.length} groups with photos:`);
    photoGroups.forEach(g => {
        const images = g.images as any[];
        const sampleImg = String(images[0] || '');
        console.log(`Group ${g.id}: Model=${g.model_code}, Color=${g.color_code}, Uph=${g.upholstery_code}, Pics=${images.length}`);

        const hasKeyword = images.some(img => {
            const s = String(img).toLowerCase();
            return s.includes('41hk') || s.includes('m4cs') || s.includes('cs');
        });

        if (hasKeyword) {
            console.log(`  !!! MATCH IN IMAGE URLS: ${sampleImg} !!!`);
        }
    });

    const cars = await fetchAll('stock_units', 'product_group_id, model_name');
    const groupIdToNames = new Map<string, Set<string>>();
    cars.forEach(c => {
        if (!groupIdToNames.has(c.product_group_id)) groupIdToNames.set(c.product_group_id, new Set());
        groupIdToNames.get(c.product_group_id)!.add(c.model_name);
    });

    console.log("\nGroups linked to 'M4 CS' via cars:");
    for (const [gid, names] of groupIdToNames.entries()) {
        const nameList = Array.from(names);
        if (nameList.some((n: any) => String(n).includes('M4 CS'))) {
            const g = groups.find(g2 => g2.id === gid);
            console.log(`Group ${gid}: Model=${g?.model_code}, Pics=${Array.isArray(g?.images) ? g?.images.length : 0}, Names=${nameList}`);
        }
    }
}
run();
