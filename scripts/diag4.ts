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
    const { data: logs } = await supabase.from('sync_logs')
        .select('*')
        .eq('vin', 'WBA11EV0209378322')
        .order('created_at', { ascending: false });

    console.log(`Logs for WBA11EV0209378322: ${logs?.length}`);
    for (const log of logs || []) {
        console.log(`\n[${log.created_at}] - ${log.change_type}`);
        console.log(`Details: ${log.details}`);
    }
}
run();
