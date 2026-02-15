#!/usr/bin/env node
/**
 * Decodes base64-encoded google-services.json from EAS Secret
 * and writes it to the correct location for the build.
 *
 * Supports two approaches:
 * 1. GOOGLE_SERVICES_JSON file-type secret (preferred) — EAS injects it directly,
 *    app.config.js reads it via process.env.GOOGLE_SERVICES_JSON. Nothing to do here.
 * 2. GOOGLE_SERVICES_JSON_BASE64 secret (legacy) — decode and write to SECRET/ dir.
 *
 * Usage: Called automatically during EAS build via eas-build-post-install hook
 */

const fs = require('fs');
const path = require('path');

const BASE64_ENV_VAR = 'GOOGLE_SERVICES_JSON_BASE64';
const FILE_ENV_VAR = 'GOOGLE_SERVICES_JSON';
const APP_VARIANT = process.env.APP_VARIANT || 'development';
const IS_PROD = APP_VARIANT === 'production';

const OUTPUT_DIR = path.join(__dirname, '..', 'SECRET');
const OUTPUT_FILE = path.join(
  OUTPUT_DIR,
  IS_PROD ? 'google-services_prod.json' : 'google-services_dev.json'
);

function main() {
  // Approach 1: File-type secret is set — EAS handles it, nothing to do
  if (process.env[FILE_ENV_VAR]) {
    console.log(`✓ ${FILE_ENV_VAR} is set as file-type secret — EAS injects it directly`);
    return;
  }

  // Approach 2: Base64 secret — decode and write
  const base64Content = process.env[BASE64_ENV_VAR];

  if (base64Content) {
    try {
      const jsonContent = Buffer.from(base64Content, 'base64').toString('utf-8');
      JSON.parse(jsonContent); // validate

      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`✓ Created directory: ${OUTPUT_DIR}`);
      }

      fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf-8');
      console.log(`✓ Successfully wrote ${OUTPUT_FILE}`);
    } catch (error) {
      console.error(`✗ Error decoding/writing google-services.json: ${error.message}`);
      process.exit(1);
    }
    return;
  }

  // Fallback: Check if file already exists locally
  if (fs.existsSync(OUTPUT_FILE)) {
    console.log(`✓ ${OUTPUT_FILE} already exists (local development)`);
    return;
  }

  console.warn(`⚠ No google-services.json source found for ${APP_VARIANT} build.`);
  console.warn(`  Set GOOGLE_SERVICES_JSON (file-type) or GOOGLE_SERVICES_JSON_BASE64 in EAS environment.`);
  console.warn(`  Build will continue — app.config.js may fail if the file is required.`);
}

main();
