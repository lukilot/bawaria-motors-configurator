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

async function run() {
    console.log("Searching all product groups for '41HK' or 'M4CS' in image URLs...");
    const { data: groups } = await supabase.from('product_groups').select('id, images, signature').not('images', 'is', null);
    
    groups?.forEach(g => {
        const imagesStr = JSON.stringify(g.images);
        if (imagesStr.toLowerCase().includes('41hk') || imagesStr.toLowerCase().includes('m4cs')) {
            console.log(`\nMatch found in Group ${g.id}:`);
            console.log(`  Signature: ${g.signature}`);
            console.log(`  Relevant Image URL(s):`);
            g.images.forEach((img: any) => {
                if (img.url.toLowerCase().includes('41hk') || img.url.toLowerCase().includes('m4cs')) {
                    console.log(`    - ${img.url}`);
                }
            });
        }
    });
    console.log("\nSearch complete.");
}
run();
