import fs from 'fs';

// A valid 1x1 transparent WebP image buffer
const webpData = Buffer.from('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==', 'base64');

async function test() {
    const formData = new FormData();
    const blob = new Blob([webpData], { type: 'image/webp' });
    formData.append('file', blob, 'test.webp');
    formData.append('groupId', '65ca03c9-4b08-478b-ae0c-8b62e8d0a3c4');

    try {
        const res = await fetch('http://localhost:3001/api/admin/upload-images', {
            method: 'POST',
            body: formData as any
        });
        
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response text:', text);
    } catch(e) {
        console.error('Fetch error:', e);
    }
}
test();
