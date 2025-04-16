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
* [Node.js](https://nodejs.org/en) (v16 or higher)
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
```

Then generate the Prisma client and initialize the vector embeddings:

```
npm run initialize
```

The initialization script will:
1. Generate the Prisma client based on your schema
2. Find all content blocks in the database
3. Generate vector embeddings for each block using Google AI (768 dimensions)
4. Store the embeddings in the database for similarity searches

### Run the chatbot

```
npm run start
```

## Complete Setup Procedure (If Having Issues)

If you're encountering issues with the setup, follow these complete steps:

1. Install dependencies:
   ```
   npm install
   ```

2. Create `.env` file with your API key:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
   GOOGLE_API_KEY=your_google_api_key_here
   ```

3. Start a fresh Supabase instance:
   ```
   npx supabase stop
   npx supabase start
   ```

4. Reset the database to apply migrations:
   ```
   npx supabase db reset
   ```

5. Generate the Prisma client:
   ```
   npx prisma generate
   ```

6. Initialize the chatbot:
   ```
   npm run initialize
   ```

7. Run the chatbot:
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

### Embedding Dimension Issues

If you see an error like `expected 1536 dimensions, not 768`:

1. The database schema is expecting vectors with a different dimension than what the embedding model produces
2. Google's `embedding-001` model produces 768-dimensional vectors
3. Make sure your migration file in `supabase/migrations/` specifies `vector(768)` for the embedding column
4. Run `npx supabase db reset` to recreate the tables with the correct dimensions

### Prisma Client Issues

If you encounter errors related to Prisma:

1. Make sure to generate the Prisma client:
   ```
   npx prisma generate
   ```

2. If that doesn't work, try:
   ```
   rm -rf node_modules
   npm install
   npx prisma generate
   ```

3. Check your Prisma schema at `prisma/schema.prisma` to ensure it's correct

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
