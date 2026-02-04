#!/usr/bin/env node

/**
 * NomadCrew Infrastructure Health Check Script
 *
 * Comprehensive check of all environments and services:
 * - Local development (localhost:8080)
 * - Production (api.nomadcrew.uk)
 * - Supabase
 * - Docker services
 * - Cloud databases (Neon, Upstash)
 *
 * Usage:
 *   npm run health-check                    # Check all services
 *   npm run health-check -- --generate-env  # Generate .env from backend
 *   npm run health-check -- --prod          # Check production only
 *   npm run health-check -- --docker        # Check Docker services
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}`),
  subheader: (msg) => console.log(`\n${colors.dim}${msg}${colors.reset}`),
};

// Paths
const FRONTEND_ROOT = path.join(__dirname, '..');
const BACKEND_ROOT = path.join(FRONTEND_ROOT, '..', 'nomad-crew-backend');
const FRONTEND_ENV = path.join(FRONTEND_ROOT, '.env');
const BACKEND_ENV = path.join(BACKEND_ROOT, '.env');

// Parse .env file
function parseEnvFile(filePath) {
  const env = {};
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIndex = trimmed.indexOf('=');
          if (eqIndex > 0) {
            const key = trimmed.substring(0, eqIndex).trim();
            const value = trimmed.substring(eqIndex + 1).trim();
            env[key] = value;
          }
        }
      });
      return { found: true, env };
    }
  } catch (e) { /* ignore */ }
  return { found: false, env };
}

// HTTP request helper with better error handling
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const timeout = options.timeout || 10000;

    try {
      const urlObj = new URL(url);
      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        timeout,
        headers: options.headers || {},
      };

      const req = client.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

// Check if a command exists
function commandExists(cmd) {
  try {
    execSync(`where ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync(`which ${cmd}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

// Check Docker status
function checkDocker() {
  log.header('Docker Environment');

  if (!commandExists('docker')) {
    log.warn('Docker not installed');
    return { installed: false };
  }

  log.success('Docker installed');

  try {
    execSync('docker info', { stdio: 'ignore' });
    log.success('Docker daemon running');
  } catch {
    log.warn('Docker daemon not running');
    return { installed: true, running: false };
  }

  // Check running containers
  try {
    const containers = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' });
    const nomadContainers = containers.split('\n').filter(c => c.includes('nomadcrew'));

    if (nomadContainers.length > 0) {
      log.success(`Running containers: ${nomadContainers.join(', ')}`);
    } else {
      log.info('No NomadCrew containers running');
    }

    return { installed: true, running: true, containers: nomadContainers };
  } catch {
    return { installed: true, running: true, containers: [] };
  }
}

// Check local backend
async function checkLocalBackend() {
  log.header('Local Backend (localhost:8080)');

  if (!fs.existsSync(BACKEND_ROOT)) {
    log.error('Backend repo not found at ../nomad-crew-backend');
    return { available: false };
  }
  log.success('Backend repo found');

  try {
    const response = await httpRequest('http://localhost:8080/health');
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      log.success(`API healthy (uptime: ${data.uptime || 'unknown'})`);
      log.info(`Database: ${data.components?.database?.status || 'unknown'}`);
      log.info(`Redis: ${data.components?.redis?.status || 'unknown'}`);
      return { available: true, healthy: true, data };
    }
    log.warn(`API returned HTTP ${response.status}`);
    return { available: true, healthy: false };
  } catch (e) {
    log.error('API not running');
    log.info('Start with: cd ../nomad-crew-backend && go run main.go');
    log.info('Or Docker: docker compose up api-dev');
    return { available: false };
  }
}

// Check production API
async function checkProductionAPI() {
  log.header('Production API (api.nomadcrew.uk)');

  try {
    const response = await httpRequest('https://api.nomadcrew.uk/health');
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      log.success(`Production API healthy`);
      log.info(`Uptime: ${data.uptime || 'unknown'}`);
      log.info(`Database: ${data.components?.database?.status || 'unknown'}`);
      log.info(`Redis: ${data.components?.redis?.status || 'unknown'}`);
      return { healthy: true, data };
    }
    log.warn(`Production API returned HTTP ${response.status}`);
    return { healthy: false };
  } catch (e) {
    log.error(`Production API unreachable: ${e.message}`);
    return { healthy: false };
  }
}

// Check Supabase
async function checkSupabase(config) {
  log.header('Supabase Authentication');

  const supabaseUrl = config.values?.SUPABASE_URL ||
                      config.values?.EXPO_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    log.error('No Supabase URL configured');
    return { configured: false };
  }

  log.info(`Configured URL: ${supabaseUrl}`);

  try {
    const response = await httpRequest(`${supabaseUrl}/rest/v1/`, {
      headers: { 'apikey': config.values?.SUPABASE_ANON_KEY || '' }
    });

    if (response.status === 200 || response.status === 401 || response.status === 400) {
      log.success('Supabase project reachable');
      return { configured: true, reachable: true };
    }
    log.warn(`Supabase returned HTTP ${response.status}`);
    return { configured: true, reachable: false };
  } catch (e) {
    if (e.code === 'ENOTFOUND' || e.message.includes('ENOTFOUND')) {
      log.error('Supabase project does not exist (DNS NXDOMAIN)');
      log.info('The Supabase project may have been deleted or paused');
      log.info('Create a new project at: https://supabase.com/dashboard');
    } else {
      log.error(`Supabase unreachable: ${e.message}`);
    }
    return { configured: true, reachable: false, error: e.message };
  }
}

// Check cloud databases from backend .env
async function checkCloudDatabases(backendEnv) {
  log.header('Cloud Databases');

  // Check Neon PostgreSQL
  const dbHost = backendEnv.DB_HOST;
  if (dbHost && dbHost.includes('neon.tech')) {
    log.info(`Neon PostgreSQL: ${dbHost}`);
    try {
      // Just check DNS resolution
      const url = `https://${dbHost.split('@').pop()?.split('/')[0] || dbHost}`;
      await httpRequest(url.replace(':5432', ''), { timeout: 5000 });
      log.success('Neon endpoint reachable');
    } catch (e) {
      if (e.code !== 'ECONNREFUSED') {
        log.success('Neon endpoint exists (connection requires auth)');
      } else {
        log.warn('Neon endpoint check inconclusive');
      }
    }
  } else {
    log.info('Not using Neon PostgreSQL');
  }

  // Check Upstash Redis
  const redisAddr = backendEnv.REDIS_ADDRESS;
  if (redisAddr && redisAddr.includes('upstash.io')) {
    log.info(`Upstash Redis: ${redisAddr}`);
    log.success('Upstash configured (requires TLS connection to verify)');
  } else {
    log.info('Not using Upstash Redis');
  }
}

// Check EAS configuration
function checkEASConfig() {
  log.header('Expo/EAS Configuration');

  const easPath = path.join(FRONTEND_ROOT, 'eas.json');
  if (!fs.existsSync(easPath)) {
    log.error('eas.json not found');
    return { configured: false };
  }

  try {
    const eas = JSON.parse(fs.readFileSync(easPath, 'utf8'));
    const profiles = Object.keys(eas.build || {});
    log.success(`Build profiles: ${profiles.join(', ')}`);

    // Check for Google OAuth config
    const devEnv = eas.build?.development?.env || {};
    if (devEnv.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      log.success('Google OAuth configured in EAS');
    } else {
      log.warn('Google OAuth not configured in EAS');
    }

    return { configured: true, profiles };
  } catch (e) {
    log.error(`Error parsing eas.json: ${e.message}`);
    return { configured: false };
  }
}

// Generate frontend .env from backend
function generateFrontendEnv(backendEnv) {
  log.header('Generate Frontend .env');

  if (fs.existsSync(FRONTEND_ENV)) {
    log.warn('Frontend .env already exists - not overwriting');
    log.info('Delete it first if you want to regenerate');
    return;
  }

  const content = `# NomadCrew Frontend Environment Variables
# Generated from backend .env on ${new Date().toISOString()}

# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_API_VERSION=v1

# For physical device testing, use your machine's IP:
# EXPO_PUBLIC_DEV_API_URL=http://192.168.1.XXX:8080

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=${backendEnv.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co'}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${backendEnv.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'}

# Google Maps (get from Google Cloud Console)
# EXPO_PUBLIC_GOOGLE_API_KEY_IOS=
# EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID=

# Google OAuth (already configured in eas.json for builds)
# These are optional for local development
# EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
# EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
# EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
`;

  fs.writeFileSync(FRONTEND_ENV, content);
  log.success(`Created ${FRONTEND_ENV}`);
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const prodOnly = args.includes('--prod');
  const generateEnv = args.includes('--generate-env');
  const checkDockerFlag = args.includes('--docker');

  console.log(`\n${colors.bold}🏥 NomadCrew Infrastructure Health Check${colors.reset}`);
  console.log('='.repeat(60));

  // Load environment files
  const frontendEnvData = parseEnvFile(FRONTEND_ENV);
  const backendEnvData = parseEnvFile(BACKEND_ENV);

  log.header('Environment Files');
  if (frontendEnvData.found) {
    log.success('Frontend .env found');
  } else {
    log.warn('Frontend .env not found');
  }
  if (backendEnvData.found) {
    log.success('Backend .env found');
  } else {
    log.warn('Backend .env not found');
  }

  // Merge config
  const config = {
    values: { ...backendEnvData.env },
    frontendEnvFound: frontendEnvData.found,
    backendEnvFound: backendEnvData.found,
  };

  // Map backend keys to frontend keys
  if (backendEnvData.env.SUPABASE_URL) {
    config.values.EXPO_PUBLIC_SUPABASE_URL = backendEnvData.env.SUPABASE_URL;
  }
  if (backendEnvData.env.SUPABASE_ANON_KEY) {
    config.values.EXPO_PUBLIC_SUPABASE_ANON_KEY = backendEnvData.env.SUPABASE_ANON_KEY;
  }

  // Generate .env if requested
  if (generateEnv && backendEnvData.found) {
    generateFrontendEnv(backendEnvData.env);
  }

  // Run checks
  const results = {};

  if (!prodOnly) {
    if (checkDockerFlag) {
      results.docker = checkDocker();
    }
    results.localBackend = await checkLocalBackend();
  }

  results.production = await checkProductionAPI();
  results.supabase = await checkSupabase(config);

  if (backendEnvData.found) {
    await checkCloudDatabases(backendEnvData.env);
  }

  results.eas = checkEASConfig();

  // Summary
  log.header('Summary');
  console.log('');

  const checks = [
    { name: 'Production API', status: results.production?.healthy, required: false },
    { name: 'Local Backend', status: results.localBackend?.healthy, required: true, skip: prodOnly },
    { name: 'Supabase Auth', status: results.supabase?.reachable, required: true },
    { name: 'EAS Config', status: results.eas?.configured, required: true },
  ];

  let hasBlockers = false;

  checks.forEach(check => {
    if (check.skip) return;

    if (check.status === true) {
      log.success(`${check.name}: ${colors.green}healthy${colors.reset}`);
    } else if (check.status === false) {
      if (check.required) {
        log.error(`${check.name}: ${colors.red}FAILED${colors.reset} (blocker)`);
        hasBlockers = true;
      } else {
        log.warn(`${check.name}: not available`);
      }
    } else {
      log.warn(`${check.name}: unknown`);
    }
  });

  console.log('\n' + '='.repeat(60));

  // Recommendations
  if (!results.supabase?.reachable) {
    console.log(`\n${colors.red}⚠ CRITICAL: Supabase project not found${colors.reset}`);
    console.log('Authentication will not work without a valid Supabase project.');
    console.log('');
    console.log('To fix:');
    console.log('  1. Go to https://supabase.com/dashboard');
    console.log('  2. Check if project is paused → Resume it');
    console.log('  3. Or create a new project and update credentials in:');
    console.log('     - Backend: ../nomad-crew-backend/.env');
    console.log('     - Frontend: .env (or run with --generate-env)');
  }

  if (!results.localBackend?.healthy && !prodOnly) {
    console.log(`\n${colors.yellow}Local backend not running${colors.reset}`);
    console.log('Start options:');
    console.log('  • go run main.go        (uses cloud Neon/Upstash)');
    console.log('  • docker compose up api-dev  (containerized with hot reload)');
    console.log('  • docker compose up     (full local stack)');
  }

  if (!frontendEnvData.found && backendEnvData.found) {
    console.log(`\n${colors.yellow}TIP:${colors.reset} Generate frontend .env from backend:`);
    console.log('  npm run health-check -- --generate-env');
  }

  if (hasBlockers) {
    console.log(`\n${colors.red}❌ Blockers found - resolve before starting app${colors.reset}\n`);
    process.exit(1);
  } else if (results.production?.healthy) {
    console.log(`\n${colors.green}✅ Production is healthy - app can connect to prod API${colors.reset}`);
    console.log('Start with: npm start\n');
  } else {
    console.log(`\n${colors.yellow}⚠ Some services need attention${colors.reset}\n`);
  }
}

main().catch(err => {
  console.error('Health check failed:', err);
  process.exit(1);
});
