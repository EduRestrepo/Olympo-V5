ALTER TABLE churn_risk_scores ADD CONSTRAINT unique_actor_churn_date UNIQUE (actor_id, analysis_date);
