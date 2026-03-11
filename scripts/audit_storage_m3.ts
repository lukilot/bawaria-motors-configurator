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
    console.log("Auditing Storage bucket 'stock-images' for M3 CS (31GB) photos...");
    
    // List all folders in 'groups/'
    const { data: folders, error: folderError } = await supabase
        .storage
        .from('stock-images')
        .list('groups', { limit: 1000 });

    if (folderError) {
        console.error("Error listing folders:", folderError);
        return;
    }

    for (const folder of folders) {
        if (folder.name === '.emptyFolderPlaceholder') continue;
        
        const { data: files } = await supabase
            .storage
            .from('stock-images')
            .list(`groups/${folder.name}`);
        
        if (files) {
            // Looking for photos that are clearly M3 CS
            // Maybe they have '31GB' or 'M3CS' or 'BLUE' or '448' or 'LAGUNA'
            const matches = files.filter(f => 
                f.name.toLowerCase().includes('31gb') || 
                f.name.toLowerCase().includes('m3cs') || 
                f.name.toLowerCase().includes('448') ||
                f.name.toLowerCase().includes('laguna') ||
                f.name.toLowerCase().includes('475') // Black
            );
            
            if (matches.length > 0) {
                console.log(`Folder ${folder.name} HAS MATCHES:`);
                matches.forEach(m => console.log(`  - ${m.name}`));
            }
        }
    }
    console.log("Audit complete.");
}
run();
