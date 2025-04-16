#!/usr/bin/env node

import 'dotenv/config';

import { Command } from "commander";
import inquirer from "inquirer";
import { handlePrompt } from "./app.js";
import { addVectorEmbeddings } from "./data.js";
import { initializeNotion } from "./notion.js";

async function initialize() {
  await addVectorEmbeddings();
  console.log("✅ Database initialized with vector embeddings");
}

async function initializeWithNotion() {
  // Check for Notion API token
  if (!process.env.NOTION_API_TOKEN) {
    console.error("❌ NOTION_API_TOKEN environment variable is required");
    console.log("Please add it to your .env file: NOTION_API_TOKEN=<your_token>");
    process.exit(1);
  }

  // Initialize Notion
  const success = await initializeNotion();
  
  if (success) {
    console.log("✅ Notion data loaded and embeddings created");
  } else {
    console.error("❌ Failed to initialize Notion data");
    process.exit(1);
  }
}

async function askQuestionsAndRespond() {
  const questionPrompt = {
     type: 'input',
     name: 'question',
     message: 'What would you like to ask? (Type "exit" to quit)',
  };

  const question = await inquirer.prompt(questionPrompt)
    .then(response => response.question);

  if (question.toLowerCase() === 'exit') {
    return;
  }

  await handlePrompt(question);
  await askQuestionsAndRespond();
}

// Start the chatbot and listen for questions
async function start() {
  console.log("🤖 Welcome to the Simple RAG Chatbot");
  console.log("Ask questions about your company knowledge base");
  console.log("Type 'exit' to quit at any time\n");
  
  await askQuestionsAndRespond();
  console.log("Thank you for chatting. Goodbye!");
}

// This is the main app
// It defines the CLI that the user interacts with
const cli = new Command();

cli
  .name('simple-rag-chatbot')
  .description('A CLI-based RAG chatbot for your company knowledge base.')
  .version('0.1.0');

cli
  .command('start')
  .description('Start the chatbot')
  .action(() => start());

cli
  .command('initialize')
  .description('Initialize the database with regular content and create vector embeddings')
  .action(() => initialize());

cli
  .command('initialize-notion')
  .description('Initialize the database with Notion content and create vector embeddings')
  .action(() => initializeWithNotion());

cli.parseAsync();
