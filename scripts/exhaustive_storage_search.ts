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
    console.log("Exhaustive storage search starting...");
    const { data: folders } = await supabase.storage.from('stock-images').list('groups', { limit: 1000 });
    if (!folders) return;

    for (const folder of folders) {
        if (folder.name === '.emptyFolderPlaceholder') continue;
        const { data: files } = await supabase.storage.from('stock-images').list(`groups/${folder.name}`);
        if (files) {
            const matches = files.filter(f => 
              f.name.toLowerCase().includes('m4') || 
              f.name.toLowerCase().includes('cs') ||
              f.name.toLowerCase().includes('475') ||
              f.name.toLowerCase().includes('c4p')
            );
            if (matches.length > 0) {
                console.log(`\nFolder ${folder.name} matches:`);
                matches.forEach(m => console.log(`  - ${m.name}`));
            }
        }
    }
    console.log("\nSearch complete.");
}
run();
