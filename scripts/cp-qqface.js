import { rmSync, mkdirSync, cpSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const source = resolve(root, 'src/renderer/src/assets/img/qq-face/public/assets/qq_emoji/resfile/emoji');
const target = resolve(root, 'src/renderer/public/img/qqface');

try {
    if (existsSync(target)) {
        rmSync(target, { recursive: true, force: true });
    }

    mkdirSync(target, { recursive: true });

    if (existsSync(source)) {
        console.log('cp qq-face ...');
        cpSync(source, target, { recursive: true });
    }

    console.log('cp qq-face done.');
} catch (error) {
    console.error('Error during cp qq-face:', error);
    process.exit(1);
}