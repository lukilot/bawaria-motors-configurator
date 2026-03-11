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
    const vins = ['WBS31GB090FU90797', 'WBS31GB050FV89097', 'WBS31GB020FW09791'];
    
    const { data: cars } = await supabase
        .from('stock_units')
        .select('vin, individual_color, product_group_id')
        .in('vin', vins);

    const groupIds = cars?.map(c => c.product_group_id).filter(Boolean) || [];
    const { data: groups } = await supabase
        .from('product_groups')
        .select('id, images, signature')
        .in('id', groupIds);

    console.log("Detailed Image URLs for M3 CS mess:");
    cars?.forEach(c => {
        const g = groups?.find(g2 => g2.id === c.product_group_id);
        console.log(`\nVIN: ${c.vin}`);
        console.log(`Group ID: ${c.product_group_id}`);
        console.log(`Signature: ${g?.signature}`);
        if (g?.images) {
            console.log(`Images: ${JSON.stringify(g.images, null, 2)}`);
        } else {
            console.log("NO IMAGES");
        }
    });

    console.log("\nSearching for any ORPHAN groups with 'M3CS' or '31GB' in signature that have photos...");
    const { data: allPhotoGroups } = await supabase
        .from('product_groups')
        .select('id, images, signature')
        .not('images', 'is', null);
    
    const m3csOrphans = allPhotoGroups?.filter(g => g.signature.includes('31GB') || g.signature.includes('M3CS'));
    m3csOrphans?.forEach(g => {
        console.log(`- Group ${g.id}: Sig=${g.signature}, Pics=${g.images.length}, Sample=${g.images[0]}`);
    });
}
run();
