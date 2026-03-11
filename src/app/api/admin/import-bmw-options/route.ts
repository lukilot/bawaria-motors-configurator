import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { launchBrowser } from '@/lib/browser-launcher';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeCode(code: string): string {
    if (!code) return '';
    if (code.startsWith('S0')) return code.substring(2);
    if (code.startsWith('P0')) return code.substring(2);
    if (code.startsWith('PI') && code.length > 4) return code.substring(2);
    if (code.match(/^[FKZ][A-Z0-9]{4}$/)) return code.substring(1);
    return code;
}

// Helper to check if a string looks like a BMW option code
function isBmwCode(s: string) {
    return /^[SP][0I][A-Z0-9]{3,5}$/.test(s) || /^[FKZ][A-Z0-9]{4}$/.test(s);
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
    const debugLogs: string[] = [];

    try {
        const { configuratorUrl, bodyGroup } = await request.json();
        if (!configuratorUrl || !bodyGroup) {
            return NextResponse.json({ error: 'Missing configuratorUrl or bodyGroup' }, { status: 400 });
        }

        browser = await launchBrowser();
        const page = await browser.newPage();

        let rawOptionImages: Record<string, string> = {};   // RAW code -> COSY URL
        let rawOptionNames: Record<string, string> = {};    // RAW code -> name

        page.on('response', async (response: any) => {
            const url = response.url();
            try {
                if (url.includes('.json') || response.headers()['content-type']?.includes('json')) {
                    const json = await response.json();
                    
                    // 1. Standard approach: Grid, Pricing, Marketing
                    if (url.includes('option-selector-grid')) {
                        const desktop = json?.collections?.['option-selector-grid']?.desktop || {};
                        for (const [code, data] of Object.entries(desktop as Record<string, any>)) {
                            const imgUrl = (data as any)?.imageGroups?.[0]?.images?.[0]?.viewImage;
                            if (imgUrl && !rawOptionImages[code]) rawOptionImages[code] = imgUrl;
                            const name = (data as any)?.salesText || (data as any)?.title;
                            if (name && !rawOptionNames[code]) rawOptionNames[code] = name;
                        }
                    }

                    if (url.includes('pricing/calculation')) {
                        const components = json?.publicCalculation?.components || [];
                        for (const comp of components) {
                            if (comp.componentId && comp.label && !rawOptionNames[comp.componentId]) {
                                rawOptionNames[comp.componentId] = comp.label;
                            }
                        }
                    }

                    if (url.includes('marketing-texts')) {
                        for (const [code, data] of Object.entries(json || {})) {
                            const name = (data as any)?.salesText || (data as any)?.option;
                            if (name && !rawOptionNames[code]) rawOptionNames[code] = name;
                        }
                    }

                    // 2. Deep recursion/Dictionary interception
                    // Handle cases where codes are direct keys of the JSON object
                    for (const [key, val] of Object.entries(json)) {
                        if (isBmwCode(key)) {
                            const name = (val as any)?.phrases?.longDescription || (val as any)?.phrases?.description || (val as any)?.salesText;
                            if (name && !rawOptionNames[key]) {
                                rawOptionNames[key] = name;
                                debugLogs.push(`Found name for ${key} in root dictionary`);
                            }
                            const imgUrl = (val as any)?.imageGroups?.[0]?.images?.[0]?.viewImage;
                            if (imgUrl && !rawOptionImages[key]) {
                                rawOptionImages[key] = imgUrl;
                                debugLogs.push(`Found image for ${key} in root dictionary`);
                            }
                        }
                    }

                    // 3. Nested collections (unified-sgt)
                    if (json.collections) {
                        for (const [collName, collData] of Object.entries(json.collections)) {
                            if (collName.includes('unified-sgt-options')) {
                                const desktop = (collData as any).desktop || (collData as any).items || {};
                                // Sometimes it has nested size-keys like "100", "200"
                                const possibleSubKeys = ['100', '200', '300', '500', '800'];
                                const subObjectsToScan = [desktop];
                                for (const sk of possibleSubKeys) {
                                    if ((collData as any)[sk]) subObjectsToScan.push((collData as any)[sk]);
                                }

                                for (const obj of subObjectsToScan) {
                                    for (const [code, data] of Object.entries(obj)) {
                                        if (isBmwCode(code)) {
                                            const imgUrl = (data as any)?.imageGroups?.[0]?.images?.[0]?.viewImage;
                                            if (imgUrl && !rawOptionImages[code]) {
                                                rawOptionImages[code] = imgUrl;
                                                debugLogs.push(`Found image for ${code} in ${collName}`);
                                            }
                                        }
                                    }
                                }
                            }
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

        const allRawCodes = new Set([
            ...Object.keys(rawOptionImages),
            ...Object.keys(rawOptionNames)
        ]);

        if (allRawCodes.size === 0) {
            return NextResponse.json({ error: 'No options found.' }, { status: 404 });
        }

        let imported = 0;
        let skipped = 0;

        for (const rawCode of allRawCodes) {
            try {
                const code = normalizeCode(rawCode);
                if (!code || code.length < 2) continue;

                let name = rawOptionNames[rawCode] || rawCode;
                if (name === rawCode || name === rawCode.substring(2)) {
                    name = rawOptionNames[`S0${code}`] || rawOptionNames[`P0${code}`] || name;
                }

                const cosyUrl = rawOptionImages[rawCode] || rawOptionImages[`S0${code}`] || rawOptionImages[`P0${code}`];
                let imageUrl = null;
                if (cosyUrl) {
                    try {
                        const compressed = await fetchAndCompress(cosyUrl);
                        imageUrl = await uploadToSupabase(compressed, bodyGroup, code);
                    } catch (err) {
                        debugLogs.push(`Image error ${code}: ${err}`);
                    }
                }

                const { data: existing } = await supabase
                    .from('dictionaries')
                    .select('id, data')
                    .eq('code', code)
                    .eq('type', 'option')
                    .maybeSingle();

                const existingBodyGroups: string[] = existing?.data?.body_groups || [];
                const updatedBodyGroups = Array.from(new Set([...existingBodyGroups, bodyGroup]));

                const upsertData = {
                    ...existing?.data,
                    name: (name && name !== code) ? name : (existing?.data?.name || name),
                    body_groups: updatedBodyGroups,
                    image_url: imageUrl || existing?.data?.image_url || null,
                };

                if (existing) {
                    await supabase.from('dictionaries').update({ data: upsertData }).eq('id', existing.id);
                } else {
                    await supabase.from('dictionaries').insert({
                        type: 'option',
                        code,
                        data: upsertData,
                    });
                }
                imported++;
            } catch (e: any) {
                debugLogs.push(`${rawCode}: ${e.message}`);
                skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            total: imported + skipped,
            debug: debugLogs.slice(0, 50),
        });

    } catch (error: any) {
        if (browser) await browser.close();
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
