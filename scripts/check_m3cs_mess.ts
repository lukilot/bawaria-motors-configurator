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
    console.log("Checking M3 CS (31GB) cars for photo mismatch...");

    const { data: cars, error: carError } = await supabase
        .from('stock_units')
        .select('vin, model_code, model_name, color_code, upholstery_code, individual_color, product_group_id, option_codes')
        .in('vin', vins);

    if (carError) {
        console.error("Error fetching cars:", carError);
        return;
    }

    const groupIds = cars.map(c => c.product_group_id).filter(Boolean);
    const { data: groups, error: groupError } = await supabase
        .from('product_groups')
        .select('*')
        .in('id', groupIds);

    if (groupError) {
        console.error("Error fetching groups:", groupError);
        return;
    }

    console.log("\n--- CAR DETAILS ---");
    cars.forEach(c => {
        const group = groups.find(g => g.id === c.product_group_id);
        console.log(`VIN: ${c.vin}`);
        console.log(`  Model: ${c.model_code} (${c.model_name})`);
        console.log(`  Color: ${c.color_code} | Uph: ${c.upholstery_code} | Individual: ${c.individual_color}`);
        console.log(`  Group ID: ${c.product_group_id}`);
        if (group) {
            console.log(`  Group Signature: ${group.signature}`);
            console.log(`  Photos: ${group.images?.length || 0} pics`);
            if (group.images && group.images.length > 0) {
              console.log(`  Sample Photo: ${group.images[0]}`);
            }
        } else {
            console.log("  !!! NO GROUP FOUND !!!");
        }
        console.log("");
    });
}
run();
