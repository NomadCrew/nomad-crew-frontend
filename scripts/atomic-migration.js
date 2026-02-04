#!/usr/bin/env node

/**
 * Atomic Design Migration Script
 * Safely migrates components to new atomic structure and updates imports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Component migration map
const MIGRATION_MAP = {
  atoms: {
    // From components/ui/
    'components/ui/Badge.tsx': 'src/components/atoms/Badge/Badge.tsx',
    'components/ui/Button.tsx': 'src/components/atoms/Button/Button.tsx',
    'components/ui/Divider.tsx': 'src/components/atoms/Divider/Divider.tsx',
    'components/ui/Chip.tsx': 'src/components/atoms/Chip/Chip.tsx',
    'components/ui/Tag.tsx': 'src/components/atoms/Tag/Tag.tsx',
    'components/ui/Avatar.tsx': 'src/components/atoms/Avatar/Avatar.tsx',
    'components/ui/IconButton.tsx': 'src/components/atoms/IconButton/IconButton.tsx',
    'components/ui/IconSymbol.tsx': 'src/components/atoms/Icon/IconSymbol.tsx',
    'components/ui/IconSymbol.ios.tsx': 'src/components/atoms/Icon/IconSymbol.ios.tsx',
    'components/ui/TabBarBackground.tsx': 'src/components/atoms/TabBarBackground/TabBarBackground.tsx',
    'components/ui/TabBarBackground.ios.tsx': 'src/components/atoms/TabBarBackground/TabBarBackground.ios.tsx',
    
    // From src/components/ui/layout/
    'src/components/ui/layout/Stack.tsx': 'src/components/atoms/Stack/Stack.tsx',
    'src/components/ui/layout/Inline.tsx': 'src/components/atoms/Inline/Inline.tsx',
    'src/components/ui/layout/Container.tsx': 'src/components/atoms/Container/Container.tsx',
    
    // From src/components/
    'src/components/ThemedText.tsx': 'src/components/atoms/ThemedText/ThemedText.tsx',
    'src/components/ThemedView.tsx': 'src/components/atoms/ThemedView/ThemedView.tsx',
  },
  
  molecules: {
    // From components/ui/
    'components/ui/Card.tsx': 'src/components/molecules/Card/Card.tsx',
    'components/ui/TextField.tsx': 'src/components/molecules/TextField/TextField.tsx',
    'components/ui/TextInput.tsx': 'src/components/molecules/TextInput/TextInput.tsx',
    'src/components/ui/EnhancedButton.tsx': 'src/components/molecules/EnhancedButton/EnhancedButton.tsx',
    'src/components/ui/RoleBadge.tsx': 'src/components/molecules/RoleBadge/RoleBadge.tsx',
    
    // Feature molecules
    'src/features/notifications/components/NotificationBadge.tsx': 'src/components/molecules/NotificationBadge/NotificationBadge.tsx',
    'src/features/trips/components/TripStatusBadge.tsx': 'src/components/molecules/StatusBadge/TripStatusBadge.tsx',
  },
  
  organisms: {
    // From components/ui/
    'components/ui/BentoGrid.tsx': 'src/components/organisms/BentoGrid/BentoGrid.tsx',
    'components/ui/BentoCarousel.tsx': 'src/components/organisms/BentoCarousel/BentoCarousel.tsx',
    'src/components/ui/TripStatusCard.tsx': 'src/components/organisms/TripCard/TripStatusCard.tsx',
    'src/components/ui/StatusAwareList.tsx': 'src/components/organisms/StatusAwareList/StatusAwareList.tsx',
    
    // Feature organisms (we'll keep these in features but document the mapping)
    // 'src/features/trips/components/TripCard.tsx': 'Keep in features',
    // 'src/features/notifications/components/NotificationList.tsx': 'Keep in features',
    // etc.
  }
};

// Import update map
const IMPORT_UPDATES = {
  // Old import -> New import
  '@/components/ui/Badge': '@/src/components/atoms/Badge',
  '@/components/ui/Button': '@/src/components/atoms/Button',
  '@/components/ui/Divider': '@/src/components/atoms/Divider',
  '@/components/ui/Chip': '@/src/components/atoms/Chip',
  '@/components/ui/Tag': '@/src/components/atoms/Tag',
  '@/components/ui/Avatar': '@/src/components/atoms/Avatar',
  '@/components/ui/IconButton': '@/src/components/atoms/IconButton',
  '@/components/ui/Card': '@/src/components/molecules/Card',
  '@/components/ui/TextField': '@/src/components/molecules/TextField',
  '@/components/ui/TextInput': '@/src/components/molecules/TextInput',
  '@/src/components/ThemedText': '@/src/components/atoms/ThemedText',
  '@/src/components/ThemedView': '@/src/components/atoms/ThemedView',
  '@/src/components/ui/layout/Stack': '@/src/components/atoms/Stack',
  '@/src/components/ui/layout/Inline': '@/src/components/atoms/Inline',
  '@/src/components/ui/layout/Container': '@/src/components/atoms/Container',
};

// Create index files for each component
function createIndexFile(componentPath, componentName) {
  const indexContent = `export { ${componentName} } from './${componentName}';
export type { ${componentName}Props } from './${componentName}';
`;
  
  const dir = path.dirname(componentPath);
  fs.writeFileSync(path.join(dir, 'index.ts'), indexContent);
}

// Copy component and create proper structure
function migrateComponent(oldPath, newPath) {
  const componentName = path.basename(newPath, '.tsx');
  const newDir = path.dirname(newPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir, { recursive: true });
  }
  
  // Copy the component file
  if (fs.existsSync(oldPath)) {
    fs.copyFileSync(oldPath, newPath);
    console.log(`✓ Copied ${oldPath} to ${newPath}`);
    
    // Create index file
    createIndexFile(newPath, componentName);
    
    return true;
  } else {
    console.log(`✗ Source file not found: ${oldPath}`);
    return false;
  }
}

// Update imports in a file
function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  for (const [oldImport, newImport] of Object.entries(IMPORT_UPDATES)) {
    const regex = new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (content.includes(oldImport)) {
      content = content.replace(regex, newImport);
      updated = true;
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated imports in ${filePath}`);
  }
  
  return updated;
}

// Find all TypeScript/React files
function findAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      findAllFiles(filePath, fileList);
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

// Main migration function
async function migrate() {
  console.log('Starting Atomic Design Migration...\n');
  
  // Step 1: Migrate components
  console.log('Step 1: Migrating components...');
  let migratedCount = 0;
  
  for (const [category, migrations] of Object.entries(MIGRATION_MAP)) {
    console.log(`\nMigrating ${category}:`);
    for (const [oldPath, newPath] of Object.entries(migrations)) {
      if (migrateComponent(oldPath, newPath)) {
        migratedCount++;
      }
    }
  }
  
  console.log(`\n✓ Migrated ${migratedCount} components\n`);
  
  // Step 2: Update imports
  console.log('Step 2: Updating imports across the codebase...');
  const files = findAllFiles('.');
  let updatedFiles = 0;
  
  for (const file of files) {
    if (updateImports(file)) {
      updatedFiles++;
    }
  }
  
  console.log(`\n✓ Updated imports in ${updatedFiles} files\n`);
  
  // Step 3: Create barrel exports
  console.log('Step 3: Creating barrel exports...');
  
  // Create main index files for each atomic level
  const levels = ['atoms', 'molecules', 'organisms', 'templates'];
  for (const level of levels) {
    const levelPath = `src/components/${level}`;
    if (fs.existsSync(levelPath)) {
      const dirs = fs.readdirSync(levelPath).filter(f => fs.statSync(path.join(levelPath, f)).isDirectory());
      const exports = dirs.map(dir => `export * from './${dir}';`).join('\n');
      fs.writeFileSync(path.join(levelPath, 'index.ts'), exports + '\n');
      console.log(`✓ Created barrel export for ${level}`);
    }
  }
  
  // Step 4: Run type checking
  console.log('\nStep 4: Running type check...');
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('✓ Type check passed');
  } catch (error) {
    console.log('✗ Type check failed - please fix type errors');
  }
  
  console.log('\nMigration complete! Please review the changes and test the application.');
}

// Run migration
if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = { migrate, MIGRATION_MAP, IMPORT_UPDATES };