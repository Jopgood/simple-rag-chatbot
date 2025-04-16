-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA extensions;

-- Create the document table
CREATE TABLE IF NOT EXISTS "public"."document" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL
);

-- Create the block table with 768 dimensions (for Google's embedding-001 model)
CREATE TABLE IF NOT EXISTS "public"."block" (
    "id" SERIAL PRIMARY KEY,
    "document_id" INTEGER REFERENCES "public"."document"("id"),
    "content" TEXT NOT NULL,
    "embedding" vector(768)
);

-- Create an index for faster similarity searches
CREATE INDEX IF NOT EXISTS "block_embedding_idx" ON "public"."block" USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
