-- Fix missing constraints for Burnout and Isolation tables

-- Add unique constraint for burnout_indicators
ALTER TABLE burnout_indicators 
ADD CONSTRAINT unique_actor_burnout_date UNIQUE (actor_id, analysis_date);

-- Add unique constraint for isolation_alerts
ALTER TABLE isolation_alerts 
ADD CONSTRAINT unique_actor_isolation_date UNIQUE (actor_id, analysis_date);
