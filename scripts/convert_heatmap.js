
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../public/heatmap.svg');
const outputPath = path.join(__dirname, '../public/heatmap.png');

console.log('Converting SVG to PNG...');

sharp(inputPath)
    .png({ quality: 80 })
    .toFile(outputPath)
    .then(info => {
        console.log('Conversion complete:', info);
    })
    .catch(err => {
        console.error('Error converting file:', err);
    });
