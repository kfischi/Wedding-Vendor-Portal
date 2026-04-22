-- Migration: add AI scoring fields to leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS ai_score       integer,
  ADD COLUMN IF NOT EXISTS ai_score_label text,
  ADD COLUMN IF NOT EXISTS ai_score_reason text;
