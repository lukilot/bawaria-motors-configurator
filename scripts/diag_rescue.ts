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
    console.log("Checking state of WBA11EV0209378322");

    // 1. Get current car state
    const { data: cars } = await supabase.from('stock_units').select('*').eq('vin', 'WBA11EV0209378322');
    if (!cars || cars.length === 0) {
        console.log("VIN not found!");
        return;
    }
    const car = cars[0];
    console.log(`Current Group ID: ${car.product_group_id}`);

    // 2. See if the current group has photos
    const { data: currentGroup } = await supabase.from('product_groups').select('signature, images').eq('id', car.product_group_id);
    console.log(`Current Group Signature: ${currentGroup?.[0]?.signature}`);
    console.log(`Current Group Photos: ${currentGroup?.[0]?.images?.length || 0}`);

    // 3. Find ALL groups matching this model/color to see how many variations exist
    const { data: allGroups } = await supabase.from('product_groups')
        .select('id, signature, images')
        .eq('model_code', car.model_code)
        .eq('color_code', car.color_code);

    console.log(`\nFound ${allGroups?.length} total groups for ${car.model_code} / ${car.color_code}`);
    allGroups?.forEach(g => {
        console.log(`Group: ${g.id}`);
        console.log(`  Signature: ${g.signature.slice(0, 100)}...`);
        console.log(`  Photos: ${g.images?.length || 0}`);
        if (g.id === car.product_group_id) console.log("  <-- CURRENT GROUP");
    });
}
run();
