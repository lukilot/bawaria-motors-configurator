import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { launchBrowser } from '@/lib/browser-launcher';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeCode(code: string): string {
    if (!code) return '';
    
    // S0248 -> 248 (3 chars)
    // S0337 -> 337 (3 chars)
    if (code.startsWith('S0')) return code.substring(2);
    
    // P0C31 -> C31 (3 chars)
    if (code.startsWith('P0')) return code.substring(2);
    
    // PI337 -> 337 (3 chars)
    // PIC4E -> C4E (3 chars)
    if (code.startsWith('PI') && code.length > 4) return code.substring(2);
    
    // FKUMY -> KUMY (4 chars as per user: 'upholstery is 4 characters')
    // FBLAT -> BLAT
    if (code.match(/^[FKZ][A-Z0-9]{4}$/)) return code.substring(1);
    
    return code;
}

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

        browser = await launchBrowser();
        const page = await browser.newPage();

        let rawOptionImages: Record<string, string> = {};   // RAW code -> COSY URL
        let rawOptionNames: Record<string, string> = {};    // RAW code -> name
        let marketingTexts: Record<string, { name: string; category?: string }> = {};

        page.on('response', async (response: any) => {
            const url = response.url();
            try {
                // 1. Grid payload (images + some names)
                if (url.includes('option-selector-grid')) {
                    const json = await response.json();
                    const desktop = json?.collections?.['option-selector-grid']?.desktop || {};
                    for (const [code, data] of Object.entries(desktop as Record<string, any>)) {
                        const imgUrl = data?.imageGroups?.[0]?.images?.[0]?.viewImage;
                        if (imgUrl && !rawOptionImages[code]) {
                            rawOptionImages[code] = imgUrl;
                        }
                        const name = data?.salesText || data?.title;
                        if (name && !rawOptionNames[code]) {
                            rawOptionNames[code] = name;
                        }
                    }
                }

                // 2. Pricing payload (labels for EVERYTHING, including standard equipment/selected)
                if (url.includes('pricing/calculation')) {
                    const json = await response.json();
                    const components = json?.publicCalculation?.components || [];
                    for (const comp of components) {
                        const code = comp.componentId;
                        if (code && comp.label && !rawOptionNames[code]) {
                            rawOptionNames[code] = comp.label;
                        }
                    }
                }

                // 3. Marketing texts (fallback)
                if (url.includes('localisations/marketing-texts')) {
                    const json = await response.json();
                    for (const [code, data] of Object.entries(json as Record<string, any>)) {
                        if (data && !marketingTexts[code]) {
                            marketingTexts[code] = {
                                name: (data as any).salesText || (data as any).option || code,
                                category: (data as any).category
                            };
                        }
                    }
                }
            } catch {
                // ignore parse errors
            }
        });

        await page.goto(configuratorUrl, { waitUntil: 'networkidle2', timeout: 90000 });
        await new Promise(r => setTimeout(r, 6000));
        await browser.close();
        browser = null;

        // Process all found codes (keys from images + names + texts)
        const allRawCodes = new Set([
            ...Object.keys(rawOptionImages),
            ...Object.keys(rawOptionNames),
            ...Object.keys(marketingTexts)
        ]);

        if (allRawCodes.size === 0) {
            return NextResponse.json({ error: 'No options found. Check URL.' }, { status: 404 });
        }

        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        // Map everything to normalized codes
        for (const rawCode of allRawCodes) {
            try {
                const code = normalizeCode(rawCode);
                if (!code || code.length < 2) continue;

                const name = rawOptionNames[rawCode] || marketingTexts[rawCode]?.name || code;
                const cosyUrl = rawOptionImages[rawCode];
                
                let imageUrl = null;
                if (cosyUrl) {
                    try {
                        const compressed = await fetchAndCompress(cosyUrl);
                        imageUrl = await uploadToSupabase(compressed, bodyGroup, code);
                    } catch (err) {
                        console.warn(`Failed to process image for ${code}:`, err);
                    }
                }

                // Fetch existing
                const { data: existing } = await supabase
                    .from('dictionaries')
                    .select('id, data')
                    .eq('code', code)
                    .eq('type', 'option')
                    .maybeSingle();

                const existingBodyGroups: string[] = existing?.data?.body_groups || [];
                const updatedBodyGroups = existingBodyGroups.includes(bodyGroup)
                    ? existingBodyGroups
                    : [...existingBodyGroups, bodyGroup];

                const upsertData = {
                    ...existing?.data,
                    name: name !== code ? name : (existing?.data?.name || name),
                    body_groups: updatedBodyGroups,
                    // Only update image_url if we found a new one from BMW
                    image_url: imageUrl || existing?.data?.image_url || null,
                };

                if (existing) {
                    const { error: updateError } = await supabase
                        .from('dictionaries')
                        .update({ data: upsertData })
                        .eq('id', existing.id);
                    if (updateError) throw updateError;
                } else {
                    const { error: insertError } = await supabase
                        .from('dictionaries')
                        .insert({
                            type: 'option',
                            code,
                            data: upsertData,
                        });
                    if (insertError) throw insertError;
                }

                imported++;
            } catch (e: any) {
                errors.push(`${rawCode}: ${e.message}`);
                skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            total: imported + skipped,
            errors: errors.slice(0, 10),
        });

    } catch (error: any) {
        console.error('BMW options import failed:', error);
        if (browser) { try { await browser.close(); } catch {} }
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
