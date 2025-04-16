# simple-rag-chatbot

A CLI-based RAG (Retrieval-Augmented Generation) chatbot that pulls information from a company knowledge base to answer questions.

## Overview

This chatbot leverages the power of LLMs (specifically Google's Gemini model) while grounding responses in your specific data. It:

1. Takes user questions through a simple CLI interface
2. Converts questions to vector embeddings
3. Finds relevant content in the database using vector similarity
4. Sends relevant context to the LLM to generate accurate, contextual responses

## Prerequisites

* [Docker](https://www.docker.com/)
* [Node.js](https://nodejs.org/en)
* A [Google AI Studio API key](https://ai.google.dev/) for embeddings and chat responses
* [Supabase local environment](https://supabase.com/docs/guides/local-development) (installed via npm/docker)

## Quickstart

### Install prerequisites

1. [Docker Desktop](https://www.docker.com/)
2. [Node.js](https://nodejs.org/en/download)
3. Local Supabase environment
   ```
   npx supabase init
   npx supabase start
   ```
4. A [Google AI Studio API Key](https://ai.google.dev/)

### Clone this repository

__SSH__

```
git clone git@github.com:Jopgood/simple-rag-chatbot.git 
```

__HTTPS__

```
git clone https://github.com/Jopgood/simple-rag-chatbot.git
```

### Install repo dependencies

```
cd simple-rag-chatbot
npm install
```

### Set required environment variables
```
export DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
export GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
```

Alternatively, create a `.env` file in the repository root with these variables.

### Initialize the database

Make sure Supabase is running, then:

```
npx supabase db reset
npm run initialize
```

If you encounter an error like `relation "public.block" does not exist`, follow these steps:

1. Stop any running Supabase instances:
   ```
   npx supabase stop
   ```

2. Start a fresh Supabase instance:
   ```
   npx supabase start
   ```

3. Apply the migrations and seed data:
   ```
   npx supabase db reset
   ```

4. Initialize the vector embeddings:
   ```
   npm run initialize
   ```

### Run the chatbot

```
npm run start
```

## Extending the Knowledge Base

To add your own company's knowledge to the chatbot:

1. Add content to the `supabase/seed.sql` file:
   ```sql
   -- Add documents
   INSERT INTO public.document (title)
   VALUES ('Your Document Title');
   
   -- Add content blocks
   INSERT INTO public.block (document_id, content)
   VALUES 
   (1, 'Your content block 1.'),
   (1, 'Your content block 2.');
   ```

2. Run the initialization process again:
   ```
   npx supabase db reset
   npm run initialize
   ```

## Customization

You can customize the chatbot's behavior in several ways:

- Modify the message similarity threshold in `app.js` (default: 0.3)
- Change the LLM prompt template in `llm.js` to alter tone and style
- Adjust the vector embedding model in `llm.js`

## Environment Variables

- `DATABASE_URL`: (required) Connection string to the PostgreSQL instance
- `GOOGLE_API_KEY`: (required) API key for Google Generative AI operations
- `DEBUG`: (optional) Comma-delimited debugging options: `main`, `data`, `llm`, `embedding`

## Troubleshooting

### Database Errors

If you see errors about missing tables like `relation "public.block" does not exist`:

1. The database schema might not be properly initialized
2. Make sure to run `npx supabase db reset` to apply the migrations
3. Check that Supabase is running with `npx supabase status`

### Vector Embedding Issues

If you encounter errors with vector embeddings:

1. Make sure the `pgvector` extension is properly installed in your Supabase instance
2. Check that your Google API key is valid and has access to the embedding models
3. Run with debug enabled: `DEBUG=embedding,llm npm run initialize`

### Connection Issues

If you have issues connecting to the database:

1. Verify the `DATABASE_URL` environment variable is correct
2. Check if Supabase is running with `npx supabase status`
3. Try restarting Supabase with `npx supabase stop` and then `npx supabase start`

## Getting a Google API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Go to the API Keys section
4. Create a new API key and copy it
5. Set the `GOOGLE_API_KEY` environment variable in your `.env` file
