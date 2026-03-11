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
    console.log("Auditing M3 groups...");

    const { data: groups, error } = await supabase
        .from('product_groups')
        .select('id, signature, model_code, color_code, images')
        .or('signature.ilike.31GB%,signature.ilike.31HJ%,signature.ilike.33GB%');

    if (error) {
        console.error(error);
        return;
    }

    (groups as any[]).forEach(g => {
        console.log(`[${g.id}] Sig: ${g.signature} | Model: ${g.model_code} | Color: ${g.color_code} | Images: ${g.images?.length || 0}`);
    });

    console.log("\nChecking for M3 units...");
    const { data: units } = await supabase
        .from('stock_units')
        .select('vin, model_code, model_name, color_code, individual_color, product_group_id')
        .or('model_code.eq.31GB,model_code.eq.31HJ,model_code.eq.33GB');

    (units as any[])?.forEach(u => {
        console.log(`VIN: ${u.vin} | Model: ${u.model_code} (${u.model_name}) | Color: ${u.color_code} | Indiv: ${u.individual_color} | Group: ${u.product_group_id}`);
    });
}
run();
