#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import mappings
const IMPORT_MAPPINGS = [
  {
    patterns: [
      /from\s+['"]@\/src\/components\/ThemedText['"]/g,
      /from\s+['"]\.\.\/ThemedText['"]/g,
      /from\s+['"]\.\.\/\.\.\/ThemedText['"]/g,
      /from\s+['"]\.\.\/\.\.\/\.\.\/ThemedText['"]/g,
    ],
    replacement: `from '@/src/components/atoms/ThemedText'`
  },
  {
    patterns: [
      /from\s+['"]@\/src\/components\/ThemedView['"]/g,
      /from\s+['"]\.\.\/ThemedView['"]/g,
      /from\s+['"]\.\.\/\.\.\/ThemedView['"]/g,
      /from\s+['"]\.\.\/\.\.\/\.\.\/ThemedView['"]/g,
    ],
    replacement: `from '@/src/components/atoms/ThemedView'`
  }
];

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  IMPORT_MAPPINGS.forEach(({ patterns, replacement }) => {
    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    });
  });

  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated: ${filePath}`);
    return true;
  }
  return false;
}

// Find all TypeScript/React files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    
    // Skip certain directories
    if (file === 'node_modules' || file === '.expo' || file === 'android' || file === 'ios' || file.startsWith('.')) {
      continue;
    }
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip the new atomic directories
      if (filePath.includes('src/components/atoms')) {
        continue;
      }
      findFiles(filePath, fileList);
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function main() {
  console.log('Updating ThemedText and ThemedView imports...\n');

  const files = findFiles('.');
  let updatedCount = 0;
  
  files.forEach(file => {
    if (updateFile(file)) {
      updatedCount++;
    }
  });

  console.log(`\n✓ Updated ${updatedCount} files`);
}

main().catch(console.error);