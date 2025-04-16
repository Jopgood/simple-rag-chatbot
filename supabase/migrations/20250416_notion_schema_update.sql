-- Add Notion-related columns to document table
ALTER TABLE "public"."document"
ADD COLUMN IF NOT EXISTS "notion_id" TEXT,
ADD COLUMN IF NOT EXISTS "notion_url" TEXT,
ADD COLUMN IF NOT EXISTS "source_type" TEXT,
ADD COLUMN IF NOT EXISTS "last_updated" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT now(),
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT now();

-- Add Notion-related columns to block table
ALTER TABLE "public"."block"
ADD COLUMN IF NOT EXISTS "notion_block_id" TEXT,
ADD COLUMN IF NOT EXISTS "context" TEXT,
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT now(),
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT now();

-- Create indexes for Notion IDs (for faster lookups during sync)
CREATE INDEX IF NOT EXISTS "idx_document_notion_id" ON "public"."document" ("notion_id");
CREATE INDEX IF NOT EXISTS "idx_block_notion_block_id" ON "public"."block" ("notion_block_id");

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
DO $$
BEGIN
    -- For document table
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_document_updated_at') THEN
        CREATE TRIGGER set_document_updated_at
        BEFORE UPDATE ON "public"."document"
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- For block table
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_block_updated_at') THEN
        CREATE TRIGGER set_block_updated_at
        BEFORE UPDATE ON "public"."block"
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;
