# Bulk Image Upload Guide

## Overview
This script helps you batch upload car images to Supabase Storage and automatically link them to car records in the database.

## Prerequisites
1. Node.js installed
2. Supabase credentials in `.env.local`
3. Images organized by VIN

## Setup

### 1. Install Dependencies
The script uses the existing Supabase client, so no additional dependencies are needed.

### 2. Organize Your Images
Create a folder structure like this:
```
images/
├── WBA12345678901234/
│   ├── 1.jpg
│   ├── 2.jpg
│   ├── 3.jpg
│   └── 4.jpg
├── WBA98765432109876/
│   ├── 1.jpg
│   └── 2.jpg
└── ...
```

**Important:**
- Each folder must be named with the exact VIN from your database
- Images will be uploaded in alphabetical order (1.jpg, 2.jpg, etc.)
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`

### 3. Environment Variables
Make sure your `.env.local` file contains:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# Optional: For better permissions
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Usage

### Run the Script
```bash
node scripts/upload-images.js ./path/to/images
```

Example:
```bash
node scripts/upload-images.js ./car-images
```

### What the Script Does
1. ✅ Checks if each VIN exists in the database
2. ✅ Uploads images to Supabase Storage at `car-images/{VIN}/{filename}`
3. ✅ Updates the `images` column in `stock_units` table with the image URLs
4. ✅ Shows progress for each VIN
5. ✅ Provides a summary at the end

### Output Example
```
🚀 Bawaria Motors - Bulk Image Upload
=====================================
📂 Images directory: /Users/you/car-images
🗄️  Supabase bucket: stock-images

📊 Found 3 VIN folders

📁 Processing VIN: WBA12345678901234
  📸 Found 4 images
  ⬆️  Uploading 1.jpg (1/4)...
  ⬆️  Uploading 2.jpg (2/4)...
  ⬆️  Uploading 3.jpg (3/4)...
  ⬆️  Uploading 4.jpg (4/4)...
  ✅ Successfully uploaded 4 images for WBA12345678901234

📊 Upload Summary
=================
✅ Successful: 3
⚠️  Skipped: 0
❌ Errors: 0
📸 Total images uploaded: 12

✨ Done!
```

## Tips

### Image Optimization
Before uploading, optimize your images:
- **Resize**: 1920px width for main images
- **Compress**: Use tools like ImageOptim or TinyPNG
- **Format**: WebP provides best compression

### Naming Convention
- Use numbers for ordering: `1.jpg`, `2.jpg`, `3.jpg`
- Or descriptive names: `exterior-front.jpg`, `interior-dashboard.jpg`
- The script maintains alphabetical order

### Batch Processing
- The script processes VINs sequentially to avoid rate limits
- For large batches (100+ cars), consider running in smaller groups
- The script uses `upsert: true`, so you can re-run it safely

### Troubleshooting

**"VIN not found in database"**
- Make sure the folder name exactly matches the VIN in your database
- VINs are case-sensitive

**"Failed to upload"**
- Check your Supabase Storage bucket exists and is named `car-images`
- Verify your Supabase credentials
- Check file permissions

**"No images found"**
- Ensure images have supported extensions (.jpg, .jpeg, .png, .webp)
- Check file names don't have special characters

## Advanced Usage

### Dry Run (Check Only)
To see what would be uploaded without actually uploading:
1. Comment out the `uploadImage` and `updateCarImages` calls
2. Run the script to see the summary

### Custom Bucket
To use a different bucket, edit the `BUCKET_NAME` constant in the script.

### Service Role Key
For better performance and permissions, use the service role key:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

This bypasses RLS policies and is faster for bulk operations.
