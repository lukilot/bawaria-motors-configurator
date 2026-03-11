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
    const { data: cars } = await supabase.from('stock_units').select('vin, color_code, individual_color, option_codes').eq('vin', 'WBS31GB090FU90797');
    if (cars && cars.length > 0) {
        console.log(`Car ${cars[0].vin} (Color ${cars[0].color_code}, Ind: ${cars[0].individual_color})`);
        console.log(`Options: ${JSON.stringify(cars[0].option_codes)}`);
    } else {
        console.log("VIN not found in active cars.");
        // Try all history
        const { data: history } = await supabase.from('stock_units').select('vin, color_code, individual_color, option_codes').filter('vin', 'eq', 'WBS31GB090FU90797');
         console.log(history);
    }
}
run();
