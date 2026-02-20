
import fs from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'src/lib/model-attributes.ts');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let modelCodeCount = 0;
let bodyGroupCount = 0;
let exceptions: string[] = [];

lines.forEach(line => {
    const match = line.match(/^\s*'([A-Z0-9]+)':\s*{\s*(.+)\s*},/);
    if (match) {
        const code = match[1];
        const propsStr = match[2];

        if (code.length !== 4) {
            exceptions.push(`Model Code '${code}' has length ${code.length}`);
        }

        const bgMatch = propsStr.match(/body_group:\s*'([^']+)'/);
        if (bgMatch) {
            const bg = bgMatch[1];
            if (bg.length !== 3) {
                exceptions.push(`Body Group '${bg}' for Model '${code}' has length ${bg.length}`);
            }
        }
        modelCodeCount++;
    }
});

console.log(`Checked ${modelCodeCount} entries.`);
if (exceptions.length === 0) {
    console.log('All model codes are 4 characters and body groups are 3 characters.');
} else {
    console.log('Exceptions found:');
    exceptions.forEach(e => console.log(e));
}
