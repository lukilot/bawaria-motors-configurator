import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const filename = `groups/65ca03c9-4b08-478b-ae0c-8b62e8d0a3c4/${Date.now()}-test.webp`;
    const optimizedBuffer = Buffer.from('test');

    const { data, error } = await supabase.storage
        .from('stock-images')
        .upload(filename, optimizedBuffer, {
            contentType: 'image/webp',
            upsert: true
        });

    if (error) {
        console.error("Supabase Error:", error.message);
    } else {
        console.log("Success:", data);
    }
}
test().catch(console.error);
