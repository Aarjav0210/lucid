-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('who_don', 'disease_sh', 'delphi_epidata', 'cdc_nndss', 'cdc_socrata', 'global_health');

-- CreateEnum
CREATE TYPE "PathogenType" AS ENUM ('virus', 'bacterium', 'fungus', 'parasite', 'prion', 'unknown');

-- CreateEnum
CREATE TYPE "HostSpeciesCategory" AS ENUM ('human', 'animal', 'crop');

-- CreateEnum
CREATE TYPE "OutbreakStatus" AS ENUM ('active', 'monitoring', 'contained', 'resolved');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('success', 'partial', 'failed');

-- CreateTable
CREATE TABLE "outbreak_events" (
    "id" UUID NOT NULL,
    "source" "Source" NOT NULL,
    "source_id" TEXT NOT NULL,
    "disease_name" TEXT NOT NULL,
    "pathogen_name" TEXT,
    "pathogen_type" "PathogenType",
    "host_species_category" "HostSpeciesCategory" NOT NULL,
    "host_species_detail" TEXT,
    "status" "OutbreakStatus" NOT NULL DEFAULT 'active',
    "location_name" TEXT NOT NULL,
    "country_iso" VARCHAR(3) NOT NULL,
    "admin_region" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "date_reported" TIMESTAMP(3) NOT NULL,
    "date_onset" TIMESTAMP(3),
    "last_report_date" TIMESTAMP(3) NOT NULL,
    "resolution_date" TIMESTAMP(3),
    "case_count" INTEGER,
    "death_count" INTEGER,
    "recovered_count" INTEGER,
    "source_url" TEXT,
    "raw_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbreak_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbreak_time_series" (
    "id" UUID NOT NULL,
    "outbreak_event_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "cumulative_cases" INTEGER,
    "cumulative_deaths" INTEGER,
    "new_cases" INTEGER,
    "new_deaths" INTEGER,

    CONSTRAINT "outbreak_time_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_poll_logs" (
    "id" UUID NOT NULL,
    "source" "Source" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "status" "PollStatus" NOT NULL,
    "events_fetched" INTEGER NOT NULL DEFAULT 0,
    "events_created" INTEGER NOT NULL DEFAULT 0,
    "events_updated" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,

    CONSTRAINT "source_poll_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outbreak_events_disease_name_status_idx" ON "outbreak_events"("disease_name", "status");

-- CreateIndex
CREATE INDEX "outbreak_events_country_iso_status_idx" ON "outbreak_events"("country_iso", "status");

-- CreateIndex
CREATE INDEX "outbreak_events_host_species_category_idx" ON "outbreak_events"("host_species_category");

-- CreateIndex
CREATE INDEX "outbreak_events_last_report_date_idx" ON "outbreak_events"("last_report_date");

-- CreateIndex
CREATE UNIQUE INDEX "outbreak_events_source_source_id_key" ON "outbreak_events"("source", "source_id");

-- CreateIndex
CREATE INDEX "outbreak_time_series_outbreak_event_id_date_idx" ON "outbreak_time_series"("outbreak_event_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "outbreak_time_series_outbreak_event_id_date_key" ON "outbreak_time_series"("outbreak_event_id", "date");

-- CreateIndex
CREATE INDEX "source_poll_logs_source_started_at_idx" ON "source_poll_logs"("source", "started_at");

-- AddForeignKey
ALTER TABLE "outbreak_time_series" ADD CONSTRAINT "outbreak_time_series_outbreak_event_id_fkey" FOREIGN KEY ("outbreak_event_id") REFERENCES "outbreak_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
