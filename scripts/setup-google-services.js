#!/usr/bin/env node
/**
 * Decodes base64-encoded google-services.json from EAS Secret
 * and writes it to the correct location for the build.
 *
 * Usage: Called automatically during EAS build via eas.json prebuild hook
 */

const fs = require('fs');
const path = require('path');

const SECRET_ENV_VAR = 'GOOGLE_SERVICES_JSON_BASE64';
const OUTPUT_DIR = path.join(__dirname, '..', 'SECRET');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'google-services_dev.json');

function main() {
  const base64Content = process.env[SECRET_ENV_VAR];

  if (!base64Content) {
    // Check if file already exists locally (for local development)
    if (fs.existsSync(OUTPUT_FILE)) {
      console.log(`✓ ${OUTPUT_FILE} already exists (local development)`);
      return;
    }

    console.error(`✗ Error: ${SECRET_ENV_VAR} environment variable not set`);
    console.error('  For EAS builds, create the secret with:');
    console.error('  eas secret:create --name GOOGLE_SERVICES_JSON_BASE64 --value "$(base64 -w 0 SECRET/google-services_dev.json)"');
    process.exit(1);
  }

  try {
    // Decode base64
    const jsonContent = Buffer.from(base64Content, 'base64').toString('utf-8');

    // Validate it's valid JSON
    JSON.parse(jsonContent);

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`✓ Created directory: ${OUTPUT_DIR}`);
    }

    // Write the file
    fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf-8');
    console.log(`✓ Successfully wrote ${OUTPUT_FILE}`);

  } catch (error) {
    console.error(`✗ Error decoding/writing google-services.json: ${error.message}`);
    process.exit(1);
  }
}

main();
