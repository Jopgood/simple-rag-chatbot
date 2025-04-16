import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import debug from "debug";
import 'dotenv/config';

const llmDebug = new debug('llm');
const embeddingDebug = new debug('embedding');

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Generate a vector embedding from text input
 * @param {string} text - The text to generate an embedding for
 * @returns {Array} - The vector embedding
 */
export async function generateEmbedding(text) {
  const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
  llmDebug(`Model: embedding-001`);
  llmDebug(`Text for embedding: ${text}`);

  // This is the call to the Google Generative AI model that generates the embedding
  const result = await embeddingModel.embedContent(text);
  const embedding = result.embedding.values;

  embeddingDebug('Embedding generated (first 10 values):');
  embeddingDebug(embedding.slice(0, 10));

  return embedding;
}

/**
 * Use the Gemini model to generate a response based on the prompt and context
 * @param {string} prompt - The user's question
 * @param {string} context - The context from the knowledge base
 * @returns {string} - The chatbot's response
 */
export async function generateChatbotResponse(prompt, context) {
  const completionsModel = "gemini-1.5-pro";

  // The system prompt to the chatbot tells it how to behave
  // and provides the RAG context
  const systemPrompt = `
    You are a helpful company knowledge assistant who provides accurate information
    based on company documentation.

    Given the following sections from the company knowledge base, answer the user's 
    question using that information as the primary source.
    
    You should:
    - Focus on information from the provided context
    - Use a conversational, helpful tone
    - Acknowledge when you don't have enough information
    - Offer follow-up questions if appropriate
    - Organize information to make it easy to understand
    
    If the answer is not explicitly in the provided context sections, say
    "I don't have enough information about that in our knowledge base."

    Context sections:
    ${context}
  `;

  llmDebug(`Model: ${completionsModel}`);
  llmDebug(`User prompt: ${prompt}`);
  
  // For context-less prompts, provide a gentle response
  if (!context || context.trim() === '') {
    llmDebug("No relevant context found");
    return "I don't have specific information about that in our knowledge base. Could you try rephrasing your question or ask about another topic?";
  }

  // Configure the Gemini model
  const geminiModel = genAI.getGenerativeModel({
    model: completionsModel,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  });

  // Start a chat session
  const chat = geminiModel.startChat({
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
    ],
  });

  // Generate a response
  const result = await chat.sendMessage(prompt);
  const response = result.response;

  llmDebug("Response generated");
  
  return `${response.text()}\n`;
}
