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
    console.log("Deep search for M4 CS (41HK) photos...");
    const { data: folders } = await supabase.storage.from('stock-images').list('groups', { limit: 1000 });
    if (!folders) return;

    for (const folder of folders) {
        if (folder.name === '.emptyFolderPlaceholder') continue;
        const { data: files } = await supabase.storage.from('stock-images').list(`groups/${folder.name}`);
        if (files) {
            // M4 CS photos are likely:
            // 1. Files with 'C4P' or '475' in name (if they were named by code)
            // 2. Or just galleries of specific count (say, 5 to 15)
            // 3. Or they contain 'M4' or 'CS'
            
            const isMatch = files.some(f => 
                f.name.toLowerCase().includes('m4') || 
                f.name.toLowerCase().includes('cs') ||
                f.name.toLowerCase().includes('41hk') ||
                f.name.toLowerCase().includes('c4p') ||
                f.name.toLowerCase().includes('475')
            );

            if (isMatch) {
                console.log(`\nPotential folder: ${folder.name} (${files.length} pics)`);
                files.forEach(f => console.log(`  - ${f.name}`));
                
                const { data: group } = await supabase.from('product_groups').select('signature').eq('id', folder.name).single();
                console.log(`  Linked Group Sig: ${group?.signature || 'NONE'}`);
            }
        }
    }
}
run();
