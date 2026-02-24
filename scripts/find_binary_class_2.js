const fs = require('fs');
const path = require('path');

function search(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fullPath.includes('node_modules') || fullPath.includes('.next') || fullPath.includes('.git') || fullPath.includes('.gemini')) continue;
        
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            search(fullPath);
        } else {
            try {
                const buffer = fs.readFileSync(fullPath);
                // Search for !b
                const idx = buffer.indexOf('!b');
                if (idx !== -1) {
                    const snippet = buffer.subarray(Math.max(0, idx - 10), Math.min(buffer.length, idx + 20));
                    if (snippet.toString('ascii').includes('mr')) {
                        console.log(`Found !b near mr in ${fullPath}`);
                        console.log('Hex:', snippet.toString('hex'));
                        console.log('Str:', snippet.toString('ascii').replace(/\n/g, ' '));
                    }
                }
            } catch (e) {
                // ignore
            }
        }
    }
}
search('.');
