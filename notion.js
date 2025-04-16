import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Client } from '@notionhq/client';
import debug from 'debug';
import { prisma } from './data.js';
import { generateEmbedding } from './llm.js';

const notionDebug = new debug('notion');

// Initialize Notion client
let notionClient = null;

/**
 * Initialize the Notion client with API token
 * @param {string} apiToken - Notion API token
 */
export function initNotionClient(apiToken) {
  notionClient = new Client({ auth: apiToken });
  notionDebug('Notion client initialized');
}

/**
 * Load and parse the Notion configuration file
 * @param {string} configPath - Path to the config file (default: ./config/notion-config.yaml)
 * @returns {Object} - Parsed configuration object
 */
export function loadNotionConfig(configPath = './config/notion-config.yaml') {
  try {
    const configFile = fs.readFileSync(path.resolve(configPath), 'utf8');
    const config = yaml.load(configFile);
    
    // Replace environment variables in the config
    if (config.auth && config.auth.api_token) {
      config.auth.api_token = config.auth.api_token.replace(
        /\${([^}]+)}/g,
        (_, varName) => process.env[varName] || ''
      );
    }
    
    notionDebug('Notion configuration loaded');
    return config;
  } catch (error) {
    notionDebug(`Error loading config: ${error.message}`);
    throw new Error(`Failed to load Notion config: ${error.message}`);
  }
}

/**
 * Retrieve and process content from Notion based on configuration
 * @param {Object} config - Notion configuration object
 * @returns {Promise<Array>} - Array of processed documents/blocks
 */
export async function fetchNotionContent(config) {
  if (!notionClient) {
    throw new Error('Notion client not initialized. Call initNotionClient first.');
  }

  const processedContent = {
    documents: [],
    blocks: []
  };

  // Process individual pages
  if (config.sources && config.sources.pages) {
    for (const page of config.sources.pages) {
      await processNotionPage(page.id, page.name, processedContent);
    }
  }

  // Process databases
  if (config.sources && config.sources.databases) {
    for (const database of config.sources.databases) {
      await processNotionDatabase(database, config.processing, processedContent);
    }
  }

  notionDebug(`Processed ${processedContent.documents.length} documents and ${processedContent.blocks.length} blocks from Notion`);
  return processedContent;
}

/**
 * Process a single Notion page
 * @param {string} pageId - Notion page ID
 * @param {string} pageName - Name for the page
 * @param {Object} processed - Object to store processed content
 */
async function processNotionPage(pageId, pageName, processed) {
  try {
    notionDebug(`Processing page: ${pageName} (${pageId})`);
    
    // Get page details
    const pageDetails = await notionClient.pages.retrieve({ page_id: pageId });
    
    // Get page content (blocks)
    const blocks = await fetchAllBlocksForPage(pageId);
    
    // Create document record
    const documentId = processed.documents.length + 1;
    processed.documents.push({
      id: documentId,
      title: pageName || getPageTitle(pageDetails),
      notion_id: pageId,
      notion_url: pageDetails.url,
      last_updated: pageDetails.last_edited_time
    });
    
    // Process blocks into content chunks
    const contentBlocks = extractContentFromBlocks(blocks, documentId);
    processed.blocks.push(...contentBlocks);
    
    notionDebug(`Page processed: ${contentBlocks.length} content blocks extracted`);
  } catch (error) {
    notionDebug(`Error processing page ${pageId}: ${error.message}`);
    console.error(`Failed to process Notion page ${pageId}: ${error.message}`);
  }
}

/**
 * Process a Notion database
 * @param {Object} database - Database configuration
 * @param {Object} processingConfig - Processing configuration
 * @param {Object} processed - Object to store processed content
 */
async function processNotionDatabase(database, processingConfig, processed) {
  try {
    notionDebug(`Processing database: ${database.name} (${database.id})`);
    
    // Query the database
    let query = {
      database_id: database.id
    };
    
    // Add filter if specified
    if (database.filter) {
      query.filter = database.filter;
    }
    
    const response = await notionClient.databases.query(query);
    
    notionDebug(`Found ${response.results.length} pages in database`);
    
    // Process each page in the database
    for (const page of response.results) {
      const pageId = page.id;
      const pageName = getPageTitleFromDatabaseItem(page, database.name);
      
      await processNotionPage(pageId, pageName, processed);
    }
  } catch (error) {
    notionDebug(`Error processing database ${database.id}: ${error.message}`);
    console.error(`Failed to process Notion database ${database.id}: ${error.message}`);
  }
}

/**
 * Fetch all blocks for a Notion page, handling pagination
 * @param {string} pageId - Notion page ID
 * @returns {Promise<Array>} - Array of blocks
 */
async function fetchAllBlocksForPage(pageId) {
  let blocks = [];
  let hasMore = true;
  let cursor = undefined;
  
  while (hasMore) {
    const response = await notionClient.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
    });
    
    blocks = [...blocks, ...response.results];
    hasMore = response.has_more;
    cursor = response.next_cursor;
  }
  
  // Recursively fetch content from nested blocks
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.has_children) {
      const childBlocks = await fetchAllBlocksForPage(block.id);
      blocks.push(...childBlocks);
    }
  }
  
  return blocks;
}

/**
 * Extract content from Notion blocks into text chunks
 * @param {Array} blocks - Array of Notion blocks
 * @param {number} documentId - Document ID for the blocks
 * @returns {Array} - Array of content blocks
 */
function extractContentFromBlocks(blocks, documentId) {
  const contentBlocks = [];
  let currentSection = '';
  let currentHeading = '';
  
  for (const block of blocks) {
    if (!block.type || !block[block.type]) continue;
    
    switch (block.type) {
      case 'heading_1':
      case 'heading_2':
      case 'heading_3':
        // If we have accumulated content, save it as a block
        if (currentSection.trim().length > 0) {
          contentBlocks.push({
            document_id: documentId,
            content: currentSection.trim(),
            notion_block_id: block.id,
            context: currentHeading
          });
        }
        
        // Update current heading
        currentHeading = block[block.type].rich_text.map(t => t.plain_text).join('');
        currentSection = `${currentHeading}:\\n`;
        break;
        
      case 'paragraph':
        const paragraphText = block.paragraph.rich_text.map(t => t.plain_text).join('');
        if (paragraphText.trim().length > 0) {
          currentSection += paragraphText + '\\n\\n';
        }
        break;
        
      case 'bulleted_list_item':
      case 'numbered_list_item':
        const listText = block[block.type].rich_text.map(t => t.plain_text).join('');
        if (listText.trim().length > 0) {
          currentSection += `• ${listText}\\n`;
        }
        break;
        
      case 'toggle':
        const toggleText = block.toggle.rich_text.map(t => t.plain_text).join('');
        if (toggleText.trim().length > 0) {
          currentSection += toggleText + '\\n\\n';
        }
        break;
        
      case 'code':
        const codeText = block.code.rich_text.map(t => t.plain_text).join('');
        const language = block.code.language || '';
        if (codeText.trim().length > 0) {
          currentSection += `Code (${language}):\\n${codeText}\\n\\n`;
        }
        break;
        
      case 'quote':
        const quoteText = block.quote.rich_text.map(t => t.plain_text).join('');
        if (quoteText.trim().length > 0) {
          currentSection += `"${quoteText}"\\n\\n`;
        }
        break;
        
      case 'callout':
        const calloutText = block.callout.rich_text.map(t => t.plain_text).join('');
        if (calloutText.trim().length > 0) {
          currentSection += `Note: ${calloutText}\\n\\n`;
        }
        break;
        
      case 'table':
        // Tables will be handled by child blocks
        break;
        
      // Add other block types as needed
    }
    
    // If section is getting too long, create a block and reset
    if (currentSection.length > 1000) {
      contentBlocks.push({
        document_id: documentId,
        content: currentSection.trim(),
        notion_block_id: block.id,
        context: currentHeading
      });
      currentSection = currentHeading ? `${currentHeading} (continued):\\n` : '';
    }
  }
  
  // Add any remaining content
  if (currentSection.trim().length > 0) {
    contentBlocks.push({
      document_id: documentId,
      content: currentSection.trim(),
      notion_block_id: blocks[blocks.length - 1]?.id,
      context: currentHeading
    });
  }
  
  return contentBlocks;
}

/**
 * Extract title from a Notion page
 * @param {Object} page - Notion page object
 * @returns {string} - Page title
 */
function getPageTitle(page) {
  if (!page || !page.properties) return 'Untitled';
  
  // Try to find a title property
  const titleProperty = Object.values(page.properties).find(
    prop => prop.type === 'title'
  );
  
  if (titleProperty && titleProperty.title) {
    return titleProperty.title.map(t => t.plain_text).join('');
  }
  
  return 'Untitled';
}

/**
 * Extract title from a database item
 * @param {Object} page - Notion page from database query
 * @param {string} defaultTitle - Default title if none found
 * @returns {string} - Page title
 */
function getPageTitleFromDatabaseItem(page, defaultTitle = 'Untitled') {
  if (!page || !page.properties) return defaultTitle;
  
  // Try to find a title property
  for (const [_, prop] of Object.entries(page.properties)) {
    if (prop.type === 'title' && prop.title.length > 0) {
      return prop.title.map(t => t.plain_text).join('');
    }
  }
  
  return defaultTitle;
}

/**
 * Store Notion content in the database and generate embeddings
 * @param {Object} content - Processed content from Notion
 */
export async function storeNotionContent(content) {
  notionDebug('Storing Notion content in database');
  
  // Store documents
  for (const doc of content.documents) {
    await prisma.document.upsert({
      where: { id: doc.id },
      update: { 
        title: doc.title,
        // Add additional fields if you've updated the schema
      },
      create: {
        id: doc.id,
        title: doc.title,
        // Add additional fields if you've updated the schema
      }
    });
  }
  
  // Store and embed blocks
  for (const block of content.blocks) {
    const embedding = await generateEmbedding(block.content);
    
    // Store block and embedding
    await prisma.$executeRaw`
      INSERT INTO block (document_id, content, embedding)
      VALUES (${block.document_id}, ${block.content}, ${JSON.stringify(embedding)}::vector)
      ON CONFLICT (id) 
      DO UPDATE SET 
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding
    `;
  }
  
  notionDebug('Notion content stored successfully');
}

/**
 * Initialize the Notion integration by loading config and fetching content
 */
export async function initializeNotion() {
  try {
    console.log('Initializing Notion integration...');
    
    // Load config
    const config = loadNotionConfig();
    
    // Initialize client
    initNotionClient(config.auth.api_token);
    
    // Fetch content
    const content = await fetchNotionContent(config);
    
    // Store content and generate embeddings
    await storeNotionContent(content);
    
    console.log('✅ Notion integration initialized successfully');
    return true;
  } catch (error) {
    console.error(`❌ Failed to initialize Notion integration: ${error.message}`);
    return false;
  }
}
