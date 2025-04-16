import debug from 'debug';

// local imports
import { getRelevantBlocks } from './data.js';
import { generateEmbedding, generateChatbotResponse } from './llm.js';

const mainDebug = new debug('main');

/**
 * Handles a user prompt - retrieves relevant content and generates a response
 * @param {string} prompt - The user's question
 * @param {number} threshold - Similarity threshold for content retrieval
 */
export async function handlePrompt(prompt, threshold=0.3) {
  // Step 1: Convert the user's prompt to an embedding
  const promptEmbedding = await generateEmbedding(prompt)
  
  // Step 2: Get the relevant context from the embeddings database
  const relevantBlocks = await getRelevantBlocks(promptEmbedding, threshold);

  // Write the relevant blocks and their similarity scores to debug logs
  mainDebug("I'll use the following additional context:");
  relevantBlocks.map(block => {
    mainDebug(`(Similarity: ${block.similarity.toPrecision(3)}) ${block.content}`);
  });

  // Step 3: Send the prompt and context to the chatbot
  const context = relevantBlocks.map(block => block.content).join("\n");
  const response = await generateChatbotResponse(prompt, context);

  // Step 4: Display the response
  console.log(response);
}
