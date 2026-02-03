-- Safely add potentially missing columns to churn_risk_scores

DO $$
BEGIN
    -- Add engagement_drop if missing
    BEGIN
        ALTER TABLE churn_risk_scores ADD COLUMN engagement_drop BOOLEAN DEFAULT FALSE;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column engagement_drop already exists in churn_risk_scores.';
    END;

    -- Add last_activity_days if missing
    BEGIN
        ALTER TABLE churn_risk_scores ADD COLUMN last_activity_days INT DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column last_activity_days already exists in churn_risk_scores.';
    END;
    
    -- Add communication_decline_pct if missing
    BEGIN
        ALTER TABLE churn_risk_scores ADD COLUMN communication_decline_pct FLOAT DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column communication_decline_pct already exists in churn_risk_scores.';
    END;

    -- Add network_shrinkage_pct if missing
    BEGIN
        ALTER TABLE churn_risk_scores ADD COLUMN network_shrinkage_pct FLOAT DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column network_shrinkage_pct already exists in churn_risk_scores.';
    END;
END;
$$;
