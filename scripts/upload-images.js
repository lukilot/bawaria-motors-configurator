#!/usr/bin/env node
/**
 * Bulk Image Upload Script for Bawaria Motors
 * 
 * This script uploads car images to Supabase Storage and links them to car records.
 * 
 * Usage:
 *   1. Organize your images in a folder structure:
 *      images/
 *        ├── VIN1/
 *        │   ├── 1.jpg
 *        │   ├── 2.jpg
 *        │   └── 3.jpg
 *        ├── VIN2/
 *        │   ├── 1.jpg
 *        │   └── 2.jpg
 *        └── ...
 * 
 *   2. Run: node scripts/upload-images.js ./images
 * 
 * Requirements:
 *   - Images should be in folders named by VIN
 *   - Supported formats: .jpg, .jpeg, .png, .webp
 *   - Images will be uploaded to: car-images/{VIN}/{filename}
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'stock-images';
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Upload a single image to Supabase Storage
 */
async function uploadImage(vin, filePath, filename) {
    const fileBuffer = fs.readFileSync(filePath);

    // Optimize image with Sharp
    console.log(`     ⚡ Optimizing...`);
    const optimizedBuffer = await sharp(fileBuffer)
        .resize(1920, 1080, { // Max dimensions
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toBuffer();

    // Force .webp extension for the uploaded file
    const targetFilename = path.parse(filename).name + '.webp';
    const storagePath = `${vin}/${targetFilename}`;

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, optimizedBuffer, {
            contentType: 'image/webp',
            upsert: true
        });

    if (error) {
        throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

    return publicUrl;
}

/**
 * Update car record with image URLs
 */
async function updateCarImages(vin, imageUrls) {
    const { error } = await supabase
        .from('stock_units')
        .update({ images: imageUrls })
        .eq('vin', vin);

    if (error) {
        throw error;
    }
}

/**
 * Process all images in a VIN folder
 */
async function processVinFolder(vinPath) {
    const vin = path.basename(vinPath);
    console.log(`\n📁 Processing VIN: ${vin}`);

    // Check if car exists in database
    const { data: car, error: fetchError } = await supabase
        .from('stock_units')
        .select('vin')
        .eq('vin', vin)
        .single();

    if (fetchError || !car) {
        console.log(`  ⚠️  VIN ${vin} not found in database, skipping...`);
        return { vin, status: 'skipped', reason: 'VIN not found' };
    }

    // Get all image files
    const files = fs.readdirSync(vinPath)
        .filter(file => SUPPORTED_FORMATS.includes(path.extname(file).toLowerCase()))
        .sort(); // Sort to maintain order

    if (files.length === 0) {
        console.log(`  ⚠️  No images found for ${vin}`);
        return { vin, status: 'skipped', reason: 'No images' };
    }

    console.log(`  📸 Found ${files.length} images`);

    // Upload images
    const imageUrls = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(vinPath, file);

        try {
            console.log(`  ⬆️  Uploading ${file} (${i + 1}/${files.length})...`);
            const url = await uploadImage(vin, filePath, file);
            imageUrls.push(url);
        } catch (error) {
            console.error(`  ❌ Failed to upload ${file}:`, error.message);
        }
    }

    // Update database
    if (imageUrls.length > 0) {
        try {
            await updateCarImages(vin, imageUrls);
            console.log(`  ✅ Successfully uploaded ${imageUrls.length} images for ${vin}`);
            return { vin, status: 'success', count: imageUrls.length };
        } catch (error) {
            console.error(`  ❌ Failed to update database:`, error.message);
            return { vin, status: 'error', reason: 'Database update failed' };
        }
    } else {
        return { vin, status: 'error', reason: 'No images uploaded' };
    }
}

/**
 * Main function
 */
async function main() {
    const imagesDir = process.argv[2];

    if (!imagesDir) {
        console.error('❌ Error: Please provide the images directory path');
        console.error('Usage: node scripts/upload-images.js ./images');
        process.exit(1);
    }

    const absolutePath = path.resolve(imagesDir);

    if (!fs.existsSync(absolutePath)) {
        console.error(`❌ Error: Directory not found: ${absolutePath}`);
        process.exit(1);
    }

    console.log('🚀 Bawaria Motors - Bulk Image Upload');
    console.log('=====================================');
    console.log(`📂 Images directory: ${absolutePath}`);
    console.log(`🗄️  Supabase bucket: ${BUCKET_NAME}`);

    // Get all VIN folders
    const vinFolders = fs.readdirSync(absolutePath)
        .map(name => path.join(absolutePath, name))
        .filter(p => fs.statSync(p).isDirectory());

    console.log(`\n📊 Found ${vinFolders.length} VIN folders\n`);

    if (vinFolders.length === 0) {
        console.log('⚠️  No VIN folders found. Please organize images by VIN.');
        process.exit(0);
    }

    // Process each VIN folder
    const results = [];
    for (const vinFolder of vinFolders) {
        const result = await processVinFolder(vinFolder);
        results.push(result);
    }

    // Summary
    console.log('\n\n📊 Upload Summary');
    console.log('=================');
    const successful = results.filter(r => r.status === 'success');
    const skipped = results.filter(r => r.status === 'skipped');
    const errors = results.filter(r => r.status === 'error');

    console.log(`✅ Successful: ${successful.length}`);
    console.log(`⚠️  Skipped: ${skipped.length}`);
    console.log(`❌ Errors: ${errors.length}`);

    if (successful.length > 0) {
        const totalImages = successful.reduce((sum, r) => sum + r.count, 0);
        console.log(`📸 Total images uploaded: ${totalImages}`);
    }

    if (errors.length > 0) {
        console.log('\n❌ Failed VINs:');
        errors.forEach(r => console.log(`  - ${r.vin}: ${r.reason}`));
    }

    console.log('\n✨ Done!\n');
}

main().catch(console.error);
