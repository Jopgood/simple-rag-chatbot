#!/usr/bin/env node

/**
 * This script synchronizes content from Notion based on the configuration.
 * It can be run manually or scheduled to keep your knowledge base up to date.
 * 
 * Usage:
 *   node scripts/sync-notion.js
 * 
 * Options:
 *   --force    Force re-indexing of all content, even if unchanged
 *   --config   Specify a different config file path
 */

import 'dotenv/config';
import { Command } from 'commander';
import { loadNotionConfig, initNotionClient, fetchNotionContent, storeNotionContent } from '../notion.js';
import debug from 'debug';

// Enable debug logging
debug.enable('notion');
const notionDebug = debug('notion');

const program = new Command();

program
  .name('sync-notion')
  .description('Synchronize content from Notion to the RAG chatbot')
  .option('-f, --force', 'Force re-indexing of all content, even if unchanged', false)
  .option('-c, --config <path>', 'Path to config file', './config/notion-config.yaml')
  .parse(process.argv);

const options = program.opts();

async function syncNotion() {
  try {
    console.log('Starting Notion sync...');
    
    // Check for Notion API token
    if (!process.env.NOTION_API_TOKEN) {
      console.error('❌ NOTION_API_TOKEN environment variable is required');
      console.log('Please add it to your .env file: NOTION_API_TOKEN=<your_token>');
      process.exit(1);
    }
    
    // Load config
    const config = loadNotionConfig(options.config);
    console.log(`Loaded configuration from ${options.config}`);
    
    // Initialize client
    initNotionClient(config.auth.api_token || process.env.NOTION_API_TOKEN);
    
    // If force option is set, modify config to ignore last_updated timestamps
    if (options.force) {
      console.log('Force option enabled - will re-index all content');
      config.sync = config.sync || {};
      config.sync.ignore_timestamps = true;
    }
    
    // Fetch content
    console.log('Fetching content from Notion...');
    const content = await fetchNotionContent(config);
    console.log(`Fetched ${content.documents.length} documents with ${content.blocks.length} content blocks`);
    
    // Store content and generate embeddings
    console.log('Storing content and generating embeddings...');
    await storeNotionContent(content);
    
    console.log('✅ Notion sync completed successfully');
    return true;
  } catch (error) {
    console.error(`❌ Failed to sync Notion content: ${error.message}`);
    if (error.stack) {
      notionDebug(error.stack);
    }
    return false;
  }
}

// Run the sync process
syncNotion()
  .then(success => {
    process.exit(success ? 0 : 1);
  });
