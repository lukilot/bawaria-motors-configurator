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
    console.log("Checking sync_logs for 41HK or 31GB changes...");
    const { data: logs, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching logs:", error);
        return;
    }

    logs.forEach(log => {
        if (JSON.stringify(log).includes('41HK') || JSON.stringify(log).includes('31GB')) {
            console.log(`Log ${log.id} (${log.created_at}):`);
            console.log(`  VIN: ${log.vin}`);
            console.log(`  Message: ${log.message}`);
            console.log(`  Details: ${JSON.stringify(log.details)}`);
        }
    });
}
run();
