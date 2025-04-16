import { Prisma, PrismaClient } from "@prisma/client";
import debug from "debug";
import { generateEmbedding } from "./llm.js";

const dataDebug = new debug('data');

export const prisma = new PrismaClient()

/**
 * Get the most relevant content blocks based on similarity to the query
 * @param {Array} promptEmbedding - Vector embedding of the user's question
 * @param {number} threshold - Minimum similarity threshold
 * @returns {Array} - Array of content blocks with similarity scores
 */
export async function getRelevantBlocks(promptEmbedding, threshold) {
  dataDebug("Performing similarity search:");
  dataDebug(`SELECT
      id,
      document_id,
      content,
      1 - (embedding::vector <=> promptEmbedding::vector) as similarity
    FROM block 
    WHERE (1 - (embedding::vector <=> promptEmbedding::vector)) > ${threshold}
    ORDER BY similarity DESC
    LIMIT 5`);

  // Retrieve blocks based on similarity to the prompt
  const relevantBlocks = await prisma.$queryRaw`
    SELECT
      id,
      document_id,
      content,
      1 - (embedding::vector <=> ${promptEmbedding}::vector) as similarity
    FROM block 
    WHERE (1 - (embedding::vector <=> ${promptEmbedding}::vector)) > ${threshold}
    ORDER BY similarity DESC
    LIMIT 5
  `;

  return relevantBlocks;
}

/**
 * Initialize embeddings for all content blocks in the database
 */
export async function addVectorEmbeddings() {
  // Get all blocks that need embeddings
  const blocks = await prisma.block.findMany();
  
  console.log(`Creating embeddings for ${blocks.length} content blocks...`);

  for (const block of blocks) {
    dataDebug(`Creating embedding for: ${block.content}`);
    const embedding = await generateEmbedding(block.content);
    
    // Update the block with its embedding
    await prisma.$executeRaw`
      UPDATE block
      SET embedding = ${JSON.stringify(embedding)}::vector
      WHERE id = ${block.id}
    `;
  }
  
  console.log(`Embeddings created for all ${blocks.length} blocks.`);
}
