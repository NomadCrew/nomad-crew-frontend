#!/usr/bin/env node
/**
 * Resize app icon to 512x512 for Play Store.
 * Run: node scripts/resize-store-icon.js
 */
const sharp = require('sharp');
const path = require('path');

const input = path.join(__dirname, '..', 'assets', 'images', 'icon.png');
const output = path.join(__dirname, '..', 'store', 'icon-512.png');

sharp(input)
  .resize(512, 512)
  .png()
  .toFile(output)
  .then(() => console.log(`✓ Created ${output}`))
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
