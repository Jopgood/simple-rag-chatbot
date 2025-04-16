#!/usr/bin/env node

/**
 * This script helps resolve migration conflicts in Supabase
 * It should be run if you encounter errors like:
 * "duplicate key value violates unique constraint schema_migrations_pkey"
 * 
 * Usage:
 *   node scripts/fix-migrations.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Supabase Migration Fix Utility 🔧');
console.log('-----------------------------------');

try {
  // 1. Stop Supabase if it's running
  console.log('Stopping Supabase...');
  execSync('npx supabase stop', { stdio: 'inherit' });
  
  // 2. Start Supabase with reset
  console.log('\nStarting Supabase with a fresh instance...');
  execSync('npx supabase start', { stdio: 'inherit' });
  
  // 3. Check for migrations directory
  const migrationsDir = path.resolve('./supabase/migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found!');
    process.exit(1);
  }
  
  // 4. List all migrations
  console.log('\nFound migrations:');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  files.forEach(file => console.log(`- ${file}`));
  
  // 5. Ensure migrations have unique timestamps
  console.log('\nChecking for timestamp conflicts...');
  const timestamps = new Set();
  const conflicts = [];
  
  files.forEach(file => {
    const timestamp = file.split('_')[0];
    if (timestamps.has(timestamp)) {
      conflicts.push(file);
    } else {
      timestamps.add(timestamp);
    }
  });
  
  if (conflicts.length > 0) {
    console.log('⚠️ Found timestamp conflicts:');
    conflicts.forEach(file => console.log(`- ${file}`));
    console.log('\nPlease manually rename these files to have unique timestamps.');
    console.log('For example: 20250416_initial_schema.sql → 20250416100000_initial_schema.sql');
  } else {
    console.log('✅ No timestamp conflicts found.');
  }
  
  // 6. Reset the database with migrations
  console.log('\nResetting database and applying migrations...');
  execSync('npx supabase db reset', { stdio: 'inherit' });
  
  // 7. Generate the Prisma client
  console.log('\nGenerating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n✅ Migration fix complete!');
  console.log('You can now try initializing your application:');
  console.log('  npm run initialize         # For standard seed data');
  console.log('  npm run initialize:notion  # For Notion integration');
  
} catch (error) {
  console.error('\n❌ An error occurred:');
  console.error(error.message);
  process.exit(1);
}
