-- Safely add potentially missing columns to Intelligence tables

DO $$
BEGIN
    -- ==========================================
    -- ISOLATION ALERTS
    -- ==========================================
    
    -- active_connections_count
    BEGIN
        ALTER TABLE isolation_alerts ADD COLUMN active_connections_count INT DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column active_connections_count already exists in isolation_alerts.';
    END;

    -- connection_decline_pct
    BEGIN
        ALTER TABLE isolation_alerts ADD COLUMN connection_decline_pct FLOAT DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column connection_decline_pct already exists in isolation_alerts.';
    END;

    -- days_since_last_interaction
    BEGIN
        ALTER TABLE isolation_alerts ADD COLUMN days_since_last_interaction INT DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column days_since_last_interaction already exists in isolation_alerts.';
    END;

    -- ==========================================
    -- BURNOUT INDICATORS
    -- ==========================================

    -- sustained_overload_weeks
    BEGIN
        ALTER TABLE burnout_indicators ADD COLUMN sustained_overload_weeks INT DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column sustained_overload_weeks already exists in burnout_indicators.';
    END;

    -- off_hours_work_pct
    BEGIN
        ALTER TABLE burnout_indicators ADD COLUMN off_hours_work_pct FLOAT DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column off_hours_work_pct already exists in burnout_indicators.';
    END;

    -- weekend_activity_pct
    BEGIN
        ALTER TABLE burnout_indicators ADD COLUMN weekend_activity_pct FLOAT DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column weekend_activity_pct already exists in burnout_indicators.';
    END;

    -- response_time_increase_pct
    BEGIN
        ALTER TABLE burnout_indicators ADD COLUMN response_time_increase_pct FLOAT DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column response_time_increase_pct already exists in burnout_indicators.';
    END;

END;
$$;
