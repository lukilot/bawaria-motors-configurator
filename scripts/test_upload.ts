import fs from 'fs';

async function test() {
    console.log('Starting test...');
    const formData = new FormData();
    // create a dummy image file
    const blob = new Blob(['dummy'], { type: 'image/webp' });
    formData.append('file', blob, 'test.webp');
    formData.append('groupId', '65ca03c9-4b08-478b-ae0c-8b62e8d0a3c4');

    try {
        const res = await fetch('http://localhost:3001/api/admin/upload-images', {
            method: 'POST',
            body: formData as any
        });
        const data = await res.json();
        console.log('Response:', res.status, data);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

test().catch(console.error);
