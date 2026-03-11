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
    const vins = [
        "WBS41HK030CU97742", "WBS41HK070CU93600", "WBS41HK020CU93682",
        "WBS41HK040CU95935", "WBS41HK040CU83333", "WBS41HK030CU76387",
        "WBS41HK010CU96010", "WBS41HK080CU88406", "WBS41HK070CU88509"
    ];

    console.log("Tracing 41HK VINs in sync_logs...");
    
    for (const vin of vins) {
        const { data: logs } = await supabase
            .from('sync_logs')
            .select('*')
            .eq('vin', vin)
            .order('created_at', { ascending: false });

        if (logs && logs.length > 0) {
            console.log(`\nLogs for VIN ${vin}:`);
            logs.forEach(log => {
                console.log(`  [${log.created_at}] ${log.message}`);
                if (log.details) console.log(`    Details: ${JSON.stringify(log.details)}`);
            });
        }
    }
}
run();
