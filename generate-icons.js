#!/usr/bin/env node

/**
 * PWA Icon Generator
 * Creates PNG icons from SVG for PWA manifest
 * Run: node generate-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG template for icon
const svgTemplate = `<svg width="SIZE" height="SIZE" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="100" fill="#4287f5"/>
  <g transform="translate(80, 200)">
    <rect x="0" y="20" width="60" height="72" rx="8" fill="white"/>
    <rect x="15" y="30" width="30" height="52" rx="4" fill="#e0e7ff"/>
    <rect x="60" y="45" width="40" height="22" rx="4" fill="white"/>
    <rect x="100" y="50" width="152" height="12" rx="6" fill="white"/>
    <rect x="252" y="45" width="40" height="22" rx="4" fill="white"/>
    <rect x="292" y="20" width="60" height="72" rx="8" fill="white"/>
    <rect x="307" y="30" width="30" height="52" rx="4" fill="#e0e7ff"/>
  </g>
  <path d="M156 340 Q256 320 356 340" stroke="white" stroke-width="8" stroke-linecap="round" fill="none"/>
</svg>`;

const sizes = [192, 512];
const publicDir = path.join(__dirname, 'public');

console.log('📱 Generating PWA icons...\n');

// Create simplified icons (since we can't use canvas in Node without additional deps)
sizes.forEach(size => {
  const svg = svgTemplate.replace(/SIZE/g, size);
  const filename = `icon-${size}.svg`;
  const filepath = path.join(publicDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✅ Created ${filename}`);
});

console.log('\n⚠️  Note: SVG icons created. For PNG conversion, use:');
console.log('   - Online tool: https://cloudconvert.com/svg-to-png');
console.log('   - Or install sharp: npm install sharp && node convert-icons.js');
console.log('   - Or use Inkscape/ImageMagick for batch conversion\n');
