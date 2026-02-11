
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMedia() {
    console.log("Fetching settings...");
    const { data: settings, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['intro_media_url', 'intro_media_url_mobile']);

    if (error) {
        console.error("Error fetching settings:", error);
        return;
    }

    for (const item of settings || []) {
        const url = item.value;
        if (!url) {
            console.log(`${item.key}: [EMPTY]`);
            continue;
        }

        try {
            const res = await fetch(url, { method: 'HEAD' });
            const size = res.headers.get('content-length');
            const type = res.headers.get('content-type');

            const sizeMb = size ? (parseInt(size) / (1024 * 1024)).toFixed(2) : '?';

            console.log(`${item.key}:`);
            console.log(`  URL: ${url}`);
            console.log(`  Type: ${type}`);
            console.log(`  Size: ${sizeMb} MB`);
        } catch (e) {
            console.error(`  Error checking ${url}:`, e);
        }
    }
}

checkMedia();
