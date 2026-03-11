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
    console.log("Parallel scanning folders for 41HK / M4CS...");
    const { data: folders } = await supabase.storage.from('stock-images').list('groups', { limit: 1000 });
    if (!folders) return;

    const CHUNK_SIZE = 20;
    for (let i = 0; i < folders.length; i += CHUNK_SIZE) {
        const chunk = folders.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (folder) => {
            if (folder.name === '.emptyFolderPlaceholder') return;
            const { data: files } = await supabase.storage.from('stock-images').list(`groups/${folder.name}`);
            if (files) {
                const isCS = files.some(f => 
                  f.name.toLowerCase().includes('41hk') || 
                  f.name.toLowerCase().includes('m4cs') ||
                  f.name.toLowerCase().includes('m4_cs')
                );
                if (isCS) {
                    console.log(`\n!!! FOUND CS in Folder ${folder.name} !!!`);
                    files.forEach(f => console.log(`  - ${f.name}`));
                }
                
                // Also check for 'C4P' or 'Brooklyn' if it's a 10-file folder
                if (files.length === 10) {
                   const isBrooklyn = files.some(f => f.name.toLowerCase().includes('c4p') || f.name.toLowerCase().includes('brooklyn'));
                   if (isBrooklyn) {
                       console.log(`\n? Possible Brooklyn M4 folder ${folder.name} (10 files)`);
                       files.forEach(f => console.log(`  - ${f.name}`));
                   }
                }
            }
        }));
    }
    console.log("\nDone.");
}
run();
