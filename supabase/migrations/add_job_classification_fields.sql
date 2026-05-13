-- Migration: add contract_type and experience_level to jobs table
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS contract_type TEXT
    CHECK (contract_type IN ('cdi', 'cdd', 'stage', 'alternance', 'freelance')),
  ADD COLUMN IF NOT EXISTS experience_level TEXT
    CHECK (experience_level IN ('intern', 'junior', 'mid', 'senior'));

CREATE INDEX IF NOT EXISTS idx_jobs_contract_type
  ON jobs(contract_type) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_jobs_experience_level
  ON jobs(experience_level) WHERE is_active = true;

-- Backfill existing rows with classifier heuristics (pure SQL approximation)
UPDATE jobs SET
  contract_type = CASE
    WHEN lower(title) ~ '(stage|internship|intern\b)' THEN 'stage'
    WHEN lower(title) ~ '(alternance|alternant|apprenti)' THEN 'alternance'
    WHEN lower(title) ~ '(freelance|contractor|mission)' THEN 'freelance'
    WHEN lower(title) ~ '\bcdd\b' THEN 'cdd'
    ELSE 'cdi'
  END,
  experience_level = CASE
    WHEN lower(title) ~ '(intern\b|stage|alternance|alternant|entry.?level|junior\b|\bjr\b)' THEN 'junior'
    WHEN lower(title) ~ '(lead|principal|staff|director|\bvp\b|head of|chief)' THEN 'senior'
    WHEN lower(title) ~ '(senior\b|\bsr\b|experienced|confirmé)' THEN 'senior'
    ELSE 'mid'
  END
WHERE contract_type IS NULL OR experience_level IS NULL;
