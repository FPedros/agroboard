-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PowerBiPanel" AS ENUM ('comercial', 'operacional', 'financeiro', 'principal');

-- CreateTable
CREATE TABLE "sectors" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "powerbi_links" (
    "id" UUID NOT NULL,
    "sectorId" UUID NOT NULL,
    "panel" "PowerBiPanel" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "powerbi_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sectors_slug_key" ON "sectors"("slug");

-- CreateIndex
CREATE INDEX "powerbi_links_panel_idx" ON "powerbi_links"("panel");

-- CreateIndex
CREATE UNIQUE INDEX "powerbi_link_sector_panel_key" ON "powerbi_links"("sectorId", "panel");

-- AddForeignKey
ALTER TABLE "powerbi_links" ADD CONSTRAINT "powerbi_links_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
