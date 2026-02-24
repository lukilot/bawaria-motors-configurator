import fs from 'fs';
import path from 'path';

function search(dir: string) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fullPath.includes('node_modules') || fullPath.includes('.next') || fullPath.includes('.git') || fullPath.includes('.gemini')) return;
        if (fs.statSync(fullPath).isDirectory()) {
            search(fullPath);
        } else {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes('\x11')) {
                    console.log(`Found \\x11 in ${fullPath}`);
                    const idx = content.indexOf('\x11');
                    console.log('Context:', content.substring(Math.max(0, idx - 20), Math.min(content.length, idx + 20)));
                }
            } catch (e) {}
        }
    });
}
search('.');
