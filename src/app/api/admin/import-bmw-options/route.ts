import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { launchBrowser } from '@/lib/browser-launcher';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAndCompress(url: string): Promise<Buffer> {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BawariaBot/1.0)' }
    });
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    return sharp(buffer)
        .resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .webp({ quality: 82 })
        .toBuffer();
}

async function uploadToSupabase(buffer: Buffer, bodyGroup: string, code: string): Promise<string> {
    const filename = `options/${bodyGroup}/${code}.webp`;
    const { error } = await supabase.storage
        .from('stock-images')
        .upload(filename, buffer, { contentType: 'image/webp', upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('stock-images').getPublicUrl(filename);
    return publicUrl;
}

export async function POST(request: NextRequest) {
    let browser: any = null;
    try {
        const { configuratorUrl, bodyGroup } = await request.json();
        if (!configuratorUrl || !bodyGroup) {
            return NextResponse.json({ error: 'Missing configuratorUrl or bodyGroup' }, { status: 400 });
        }

        // Launch browser (works on Vercel + local)
        browser = await launchBrowser();


        const page = await browser.newPage();

        let optionImages: Record<string, string> = {};   // code -> COSY URL
        let optionNames: Record<string, string> = {};    // code -> fallback name
        let marketingTexts: Record<string, { name: string; salesText?: string; category?: string }> = {};

        page.on('response', async (response: any) => {
            const url = response.url();
            try {
                if (url.includes('option-selector-grid')) {
                    const json = await response.json();
                    const desktop = json?.collections?.['option-selector-grid']?.desktop || {};
                    for (const [code, data] of Object.entries(desktop as Record<string, any>)) {
                        const imgUrl = data?.imageGroups?.[0]?.images?.[0]?.viewImage;
                        if (imgUrl && !optionImages[code]) {
                            optionImages[code] = imgUrl;
                        }
                        const name = data?.salesText || data?.title;
                        if (name && !optionNames[code]) {
                            optionNames[code] = name;
                        }
                    }
                }

                if (url.includes('localisations/marketing-texts') && url.includes('validity')) {
                    const json = await response.json();
                    for (const [code, data] of Object.entries(json as Record<string, any>)) {
                        if (!marketingTexts[code]) {
                            marketingTexts[code] = {
                                name: (data as any).option || (data as any).salesText || code,
                                salesText: (data as any).salesText,
                                category: (data as any).category,
                            };
                        }
                    }
                }
            } catch {
                // ignore parse errors
            }
        });

        await page.goto(configuratorUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 4000));
        await browser.close();
        browser = null;

        const codes = Object.keys(optionImages);
        if (codes.length === 0) {
            return NextResponse.json({ error: 'No option images found. Check configuratorUrl.' }, { status: 404 });
        }

        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const code of codes) {
            try {
                const cosyUrl = optionImages[code];
                const textData = marketingTexts[code];

                // Download + compress + upload to Supabase (permanent storage)
                const compressed = await fetchAndCompress(cosyUrl);
                const imageUrl = await uploadToSupabase(compressed, bodyGroup, code);

                // Detect exact category type from code prefix
                let categoryType: 'paint' | 'upholstery' | 'package' | 'equipment' = 'equipment';
                
                if (code.startsWith('P0') || code.startsWith('P1') || code.startsWith('PIC')) {
                    categoryType = 'paint';
                } else if (code.startsWith('PIU') || code.startsWith('S04')) {
                    categoryType = 'upholstery';
                } else if (code.match(/^[FKZ][A-Z0-9]{4}$/)) {
                    // Tapicerka usually has 5 letter codes like FBLAT, KGNL
                    categoryType = 'upholstery';
                } else if (code.startsWith('PIP') || code.startsWith('P0C')) {
                    categoryType = 'package';
                }

                const finalName = textData?.name || optionNames[code] || code;

                // Fetch existing entry
                const { data: existing } = await supabase
                    .from('dictionaries')
                    .select('id, data')
                    .eq('code', code)
                    .eq('type', 'option')
                    .maybeSingle();

                if (existing) {
                    // Merge: add bodyGroup if not already there, update image_url
                    const existingBodyGroups: string[] = existing.data?.body_groups || [];
                    const updatedBodyGroups = existingBodyGroups.includes(bodyGroup)
                        ? existingBodyGroups
                        : [...existingBodyGroups, bodyGroup];

                    const { error: updateError } = await supabase
                        .from('dictionaries')
                        .update({
                            data: {
                                ...existing.data,
                                name: finalName,
                                category: categoryType,
                                body_groups: updatedBodyGroups,
                                image_url: existing.data?.image_url || imageUrl,
                            },
                        })
                        .eq('id', existing.id);
                    if (updateError) throw updateError;
                } else {
                    // Insert new entry
                    const { error: insertError } = await supabase
                        .from('dictionaries')
                        .insert({
                            type: 'option',
                            code,
                            data: {
                                name: finalName,
                                category: categoryType,
                                body_groups: [bodyGroup],
                                image_url: imageUrl,
                            },
                        });
                    if (insertError) throw insertError;
                }

                imported++;
            } catch (e: any) {
                errors.push(`${code}: ${e.message}`);
                skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            total: codes.length,
            errors: errors.slice(0, 10),
        });

    } catch (error: any) {
        console.error('BMW options import failed:', error);
        if (browser) { try { await browser.close(); } catch {} }
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
