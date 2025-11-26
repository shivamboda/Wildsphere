
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const animalsPath = path.join(__dirname, '../src/data/animals.json');
const geojsonPath = path.join(__dirname, '../public/borders.geojson');
const outputPath = path.join(__dirname, '../public/heatmap.svg');

const rawAnimals = fs.readFileSync(animalsPath, 'utf-8');
const animals = JSON.parse(rawAnimals);

const rawGeojson = fs.readFileSync(geojsonPath, 'utf-8');
const geojson = JSON.parse(rawGeojson);

const width = 4096;
const height = 2048;

// Multi-layer glow configuration
const layers = [
  { radius: 45, opacity: 0.08, color: '#4c1d95' }, // Deep Purple
  { radius: 25, opacity: 0.15, color: '#db2777' }, // Pink/Magenta
  { radius: 8, opacity: 0.4, color: '#fbbf24' }  // Amber/Gold
];

const blurStdDev = 12;

// Helper to project lat/lng to x/y
function project(lng, lat) {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

// Helper to generate SVG path data from coordinates
function getPathData(coords) {
  if (!coords || coords.length === 0) return '';

  let d = '';
  let first = true;

  for (const point of coords) {
    const { x, y } = project(point[0], point[1]);
    if (first) {
      d += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
      first = false;
    } else {
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
  }
  d += ' Z'; // Close path
  return d;
}

let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="blur">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${blurStdDev}" />
    </filter>
  </defs>
  
  <!-- Deep dark background -->
  <rect width="${width}" height="${height}" fill="#0a0a0a" opacity="0.8" />
  
  <!-- Heatmap Layers -->
  <g filter="url(#blur)">
`;

// Draw Heatmap Points
layers.forEach(layer => {
  animals.forEach(animal => {
    const { x, y } = project(animal.lng, animal.lat);
    svgContent += `    <circle cx="${x}" cy="${y}" r="${layer.radius}" fill="${layer.color}" opacity="${layer.opacity}" />\n`;
  });
});

svgContent += `  </g>

  <!-- Country Borders (Baked on top) -->
  <g stroke="rgba(100, 200, 255, 0.4)" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round">
`;

// Draw GeoJSON Features
geojson.features.forEach(feature => {
  const type = feature.geometry.type;
  const coords = feature.geometry.coordinates;

  if (type === 'Polygon') {
    coords.forEach(ring => {
      svgContent += `    <path d="${getPathData(ring)}" />\n`;
    });
  } else if (type === 'MultiPolygon') {
    coords.forEach(polygon => {
      polygon.forEach(ring => {
        svgContent += `    <path d="${getPathData(ring)}" />\n`;
      });
    });
  }
});

svgContent += `  </g>
</svg>`;

fs.writeFileSync(outputPath, svgContent);
console.log(`Heatmap SVG with baked borders generated at ${outputPath}`);
