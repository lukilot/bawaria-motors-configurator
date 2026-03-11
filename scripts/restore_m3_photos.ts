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
    console.log("Starting M3 CS Photo Restoration...");

    // 1. Black Touring Group (89cbf4c3...)
    const blackGid = '89cbf4c3-ab48-4a42-b5fb-18a6f05fd340';
    console.log(`Fixing Black Touring Group ${blackGid}...`);
    
    // Get files from its own folder
    const { data: blackFiles } = await supabase.storage.from('stock-images').list(`groups/${blackGid}`);
    if (blackFiles) {
        const blackImages = blackFiles
            .filter(f => f.name !== '.emptyFolderPlaceholder')
            .map((f, i) => ({
                id: crypto.randomUUID(),
                url: `${supabaseUrl}/storage/v1/object/public/stock-images/groups/${blackGid}/${f.name}`,
                sort_order: i
            }));
        
        await supabase.from('product_groups').update({ images: blackImages }).eq('id', blackGid);
        console.log(`  Updated with ${blackImages.length} images from its own folder.`);
    }

    // 2. Blue Touring Groups (929b3654... and 72b61657...)
    const blueGidSource = '1be8968c-36dd-4bdc-b102-8bc6297c877b'; // The folder containing Blue photos
    const blueTargetGids = ['929b3654-0286-4ce8-8ea9-6c4bb5cd1942', '72b61657-efd4-471b-8492-af719244c550'];
    
    console.log(`\nFixing Blue Touring Groups using source folder ${blueGidSource}...`);
    const { data: blueFiles } = await supabase.storage.from('stock-images').list(`groups/${blueGidSource}`);
    
    if (blueFiles) {
        const blueImages = blueFiles
            .filter(f => f.name !== '.emptyFolderPlaceholder')
            .map((f, i) => ({
                id: crypto.randomUUID(),
                url: `${supabaseUrl}/storage/v1/object/public/stock-images/groups/${blueGidSource}/${f.name}`,
                sort_order: i
            }));

        for (const gid of blueTargetGids) {
            await supabase.from('product_groups').update({ images: blueImages }).eq('id', gid);
            console.log(`  Updated Group ${gid} with ${blueImages.length} Blue images.`);
        }
    }

    console.log("\nRestoration complete.");
}
run();
