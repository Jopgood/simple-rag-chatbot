#!/usr/bin/env node

/**
 * This script cleans up old migration files that may cause conflicts
 * Run this after successfully testing the migrations
 */

import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.resolve('supabase/migrations');
const OLD_MIGRATIONS = [
  '20250416_initial_schema.sql',
  '20250416103000_notion_schema_update.sql'
];

console.log('Cleaning up old migration files...');

// Check if migrations directory exists
if (!fs.existsSync(MIGRATIONS_DIR)) {
  console.error(`Directory not found: ${MIGRATIONS_DIR}`);
  process.exit(1);
}

// Delete old migration files
for (const migrationFile of OLD_MIGRATIONS) {
  const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
  
  if (fs.existsSync(migrationPath)) {
    try {
      fs.unlinkSync(migrationPath);
      console.log(`✓ Deleted: ${migrationFile}`);
    } catch (error) {
      console.error(`Failed to delete ${migrationFile}: ${error.message}`);
    }
  } else {
    console.log(`File not found (already deleted): ${migrationFile}`);
  }
}

console.log('Migration cleanup complete!');
