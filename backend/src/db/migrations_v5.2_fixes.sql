-- ============================================================================
-- OLYMPO V5.2 - Fixes & Constraints
-- ============================================================================

-- 1. Fix Missing Unique Constraints in Meeting Analysis
-- We truncate these tables to ensure no duplicate data prevents constraint creation.
-- These tables are analytical and will be repopulated by the ingestion process.

TRUNCATE TABLE meeting_recommendations;
TRUNCATE TABLE meeting_efficiency_scores;

-- Add Unique Constraint to Meeting Efficiency Scores
-- A meeting should only have one efficiency score record
ALTER TABLE meeting_efficiency_scores
ADD CONSTRAINT unique_meeting_id UNIQUE (meeting_id);

-- Add Unique Constraint to Meeting Recommendations
-- A meeting can have multiple recommendations, but only one of each type
ALTER TABLE meeting_recommendations
ADD CONSTRAINT unique_meeting_recommendation UNIQUE (meeting_id, recommendation_type);
