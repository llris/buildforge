-- AlterTable
ALTER TABLE "SavedBuild" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "SavedBuild" ADD COLUMN IF NOT EXISTS "useCase" TEXT DEFAULT 'GAMING';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BuildShare_isPublic_createdAt_idx" ON "BuildShare"("isPublic", "createdAt");
CREATE INDEX IF NOT EXISTS "BuildShare_isPublic_viewCount_idx" ON "BuildShare"("isPublic", "viewCount");
