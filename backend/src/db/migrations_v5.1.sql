-- ============================================================================
-- OLYMPO V5.1 - Advanced Analytics Features
-- Migration Script for New Tables
-- ============================================================================

-- ============================================================================
-- TEMPORAL ANALYSIS TABLES
-- ============================================================================

-- Activity Heatmap: Hourly/Daily activity patterns
CREATE TABLE activity_heatmap (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    hour_of_day INT NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
    email_count INT DEFAULT 0,
    meeting_count INT DEFAULT 0,
    total_activity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_actor_date_hour UNIQUE (actor_id, activity_date, hour_of_day)
);

CREATE INDEX idx_activity_heatmap_actor ON activity_heatmap(actor_id);
CREATE INDEX idx_activity_heatmap_date ON activity_heatmap(activity_date);

-- Overload Metrics: Users with excessive workload
CREATE TABLE overload_metrics (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    total_meetings INT DEFAULT 0,
    total_meeting_hours FLOAT DEFAULT 0,
    emails_sent INT DEFAULT 0,
    emails_received INT DEFAULT 0,
    overload_score FLOAT DEFAULT 0 CHECK (overload_score >= 0 AND overload_score <= 100),
    risk_level VARCHAR(20) DEFAULT 'normal', -- 'normal', 'warning', 'critical'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_actor_week UNIQUE (actor_id, week_start_date)
);

CREATE INDEX idx_overload_actor ON overload_metrics(actor_id);
CREATE INDEX idx_overload_week ON overload_metrics(week_start_date);
CREATE INDEX idx_overload_risk ON overload_metrics(risk_level);

-- Response Time Analysis: Detailed response metrics
CREATE TABLE response_time_analysis (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    department VARCHAR(255),
    avg_response_hours FLOAT DEFAULT 0,
    median_response_hours FLOAT DEFAULT 0,
    response_count INT DEFAULT 0,
    fast_responses INT DEFAULT 0, -- < 1 hour
    slow_responses INT DEFAULT 0, -- > 24 hours
    analysis_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_actor_response_date UNIQUE (actor_id, analysis_date)
);

CREATE INDEX idx_response_actor ON response_time_analysis(actor_id);
CREATE INDEX idx_response_dept ON response_time_analysis(department);

-- Timezone Collaboration: Cross-timezone work patterns
CREATE TABLE timezone_collaboration (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    timezone VARCHAR(50),
    off_hours_emails INT DEFAULT 0, -- Emails sent outside 9-5
    cross_timezone_meetings INT DEFAULT 0,
    late_night_activity INT DEFAULT 0, -- Activity after 10pm
    early_morning_activity INT DEFAULT 0, -- Activity before 6am
    analysis_month DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_actor_timezone_month UNIQUE (actor_id, analysis_month)
);

CREATE INDEX idx_timezone_actor ON timezone_collaboration(actor_id);

-- ============================================================================
-- COMMUNITY DETECTION TABLES
-- ============================================================================

-- Communities: Detected clusters
CREATE TABLE communities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    member_count INT DEFAULT 0,
    avg_internal_connections FLOAT DEFAULT 0,
    modularity_score FLOAT DEFAULT 0,
    detection_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community Members: User-to-community mapping
CREATE TABLE community_members (
    id SERIAL PRIMARY KEY,
    community_id INT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    membership_strength FLOAT DEFAULT 0 CHECK (membership_strength >= 0 AND membership_strength <= 1),
    is_core_member BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_community_actor UNIQUE (community_id, actor_id)
);

CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_community_members_actor ON community_members(actor_id);

-- Organizational Silos: Isolated departments
CREATE TABLE organizational_silos (
    id SERIAL PRIMARY KEY,
    department VARCHAR(255) NOT NULL,
    isolation_score FLOAT DEFAULT 0 CHECK (isolation_score >= 0 AND isolation_score <= 100),
    internal_connections INT DEFAULT 0,
    external_connections INT DEFAULT 0,
    silo_risk VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high'
    detection_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_silos_dept ON organizational_silos(department);
CREATE INDEX idx_silos_risk ON organizational_silos(silo_risk);

-- Network Bridges: Key connectors between communities
CREATE TABLE network_bridges (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    betweenness_centrality FLOAT DEFAULT 0,
    communities_connected INT DEFAULT 0,
    bridge_score FLOAT DEFAULT 0 CHECK (bridge_score >= 0 AND bridge_score <= 100),
    detection_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_bridge_actor_date UNIQUE (actor_id, detection_date)
);

CREATE INDEX idx_bridges_actor ON network_bridges(actor_id);
CREATE INDEX idx_bridges_score ON network_bridges(bridge_score DESC);

-- ============================================================================
-- MEETING ANALYSIS TABLES
-- ============================================================================

-- Meeting Efficiency Scores
CREATE TABLE meeting_efficiency_scores (
    id SERIAL PRIMARY KEY,
    meeting_id VARCHAR(255), -- External meeting ID from Teams
    organizer_id INT REFERENCES actors(id) ON DELETE SET NULL,
    participant_count INT DEFAULT 0,
    duration_minutes INT DEFAULT 0,
    efficiency_score FLOAT DEFAULT 0 CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
    cost_hours FLOAT DEFAULT 0, -- participant_count * duration
    has_agenda BOOLEAN DEFAULT FALSE,
    started_on_time BOOLEAN DEFAULT TRUE,
    meeting_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meeting_efficiency_organizer ON meeting_efficiency_scores(organizer_id);
CREATE INDEX idx_meeting_efficiency_date ON meeting_efficiency_scores(meeting_date);
CREATE INDEX idx_meeting_efficiency_score ON meeting_efficiency_scores(efficiency_score);

-- Attendance Patterns
CREATE TABLE attendance_patterns (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    total_meetings_invited INT DEFAULT 0,
    meetings_attended INT DEFAULT 0,
    meetings_declined INT DEFAULT 0,
    late_arrivals INT DEFAULT 0,
    early_departures INT DEFAULT 0,
    attendance_rate FLOAT DEFAULT 0,
    analysis_month DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_actor_attendance_month UNIQUE (actor_id, analysis_month)
);

CREATE INDEX idx_attendance_actor ON attendance_patterns(actor_id);

-- Meeting Recommendations
CREATE TABLE meeting_recommendations (
    id SERIAL PRIMARY KEY,
    meeting_id VARCHAR(255),
    recommendation_type VARCHAR(50), -- 'reduce_duration', 'reduce_participants', 'could_be_email', 'split_meeting'
    recommendation_text TEXT,
    potential_savings_hours FLOAT DEFAULT 0,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_type ON meeting_recommendations(recommendation_type);

-- ============================================================================
-- PREDICTIVE ANALYTICS TABLES
-- ============================================================================

-- Churn Risk Scores
CREATE TABLE churn_risk_scores (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    risk_score FLOAT DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high'
    communication_decline_pct FLOAT DEFAULT 0,
    network_shrinkage_pct FLOAT DEFAULT 0,
    engagement_drop BOOLEAN DEFAULT FALSE,
    last_activity_days INT DEFAULT 0,
    analysis_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_actor_churn_date UNIQUE (actor_id, analysis_date)
);

CREATE INDEX idx_churn_actor ON churn_risk_scores(actor_id);
CREATE INDEX idx_churn_risk ON churn_risk_scores(risk_level);

-- Burnout Indicators
CREATE TABLE burnout_indicators (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    burnout_score FLOAT DEFAULT 0 CHECK (burnout_score >= 0 AND burnout_score <= 100),
    risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high'
    sustained_overload_weeks INT DEFAULT 0,
    off_hours_work_pct FLOAT DEFAULT 0,
    weekend_activity_pct FLOAT DEFAULT 0,
    response_time_increase_pct FLOAT DEFAULT 0,
    analysis_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_actor_burnout_date UNIQUE (actor_id, analysis_date)
);

CREATE INDEX idx_burnout_actor ON burnout_indicators(actor_id);
CREATE INDEX idx_burnout_risk ON burnout_indicators(risk_level);

-- Isolation Alerts
CREATE TABLE isolation_alerts (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    isolation_score FLOAT DEFAULT 0 CHECK (isolation_score >= 0 AND isolation_score <= 100),
    alert_level VARCHAR(20) DEFAULT 'none', -- 'none', 'warning', 'critical'
    active_connections_count INT DEFAULT 0,
    connection_decline_pct FLOAT DEFAULT 0,
    days_since_last_interaction INT DEFAULT 0,
    suggested_connections TEXT, -- JSON array of suggested actor IDs
    analysis_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_actor_isolation_date UNIQUE (actor_id, analysis_date)
);

CREATE INDEX idx_isolation_actor ON isolation_alerts(actor_id);
CREATE INDEX idx_isolation_alert ON isolation_alerts(alert_level);

-- Collaboration Forecasts
CREATE TABLE collaboration_forecasts (
    id SERIAL PRIMARY KEY,
    department VARCHAR(255),
    forecast_month DATE NOT NULL,
    predicted_volume INT DEFAULT 0,
    predicted_growth_pct FLOAT DEFAULT 0,
    confidence_level FLOAT DEFAULT 0 CHECK (confidence_level >= 0 AND confidence_level <= 1),
    resource_recommendation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_dept_forecast_month UNIQUE (department, forecast_month)
);

CREATE INDEX idx_forecast_dept ON collaboration_forecasts(department);

-- ============================================================================
-- CONTENT METADATA TABLES
-- ============================================================================

-- Email Subject Keywords (No content, only metadata)
CREATE TABLE email_subject_keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    frequency INT DEFAULT 1,
    department VARCHAR(255),
    first_seen DATE NOT NULL,
    last_seen DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_keywords_keyword ON email_subject_keywords(keyword);
CREATE INDEX idx_keywords_dept ON email_subject_keywords(department);

-- Urgency Metrics
CREATE TABLE urgency_metrics (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    urgent_emails_sent INT DEFAULT 0,
    urgent_emails_received INT DEFAULT 0,
    urgency_rate FLOAT DEFAULT 0, -- % of emails marked urgent
    analysis_month DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_actor_urgency_month UNIQUE (actor_id, analysis_month)
);

CREATE INDEX idx_urgency_actor ON urgency_metrics(actor_id);

-- Sentiment Indicators (Basic, from metadata only)
CREATE TABLE sentiment_indicators (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    positive_indicators INT DEFAULT 0, -- Thanks, Great, etc.
    negative_indicators INT DEFAULT 0, -- Urgent, Issue, Problem, etc.
    neutral_count INT DEFAULT 0,
    sentiment_score FLOAT DEFAULT 0, -- -1 to 1
    analysis_month DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_actor_sentiment_month UNIQUE (actor_id, analysis_month)
);

CREATE INDEX idx_sentiment_actor ON sentiment_indicators(actor_id);

-- ============================================================================
-- BENCHMARKING TABLES
-- ============================================================================

-- Department Benchmarks
CREATE TABLE department_benchmarks (
    id SERIAL PRIMARY KEY,
    department VARCHAR(255) NOT NULL,
    metric_name VARCHAR(100) NOT NULL, -- 'avg_response_time', 'collaboration_score', etc.
    metric_value FLOAT DEFAULT 0,
    percentile_rank FLOAT DEFAULT 0, -- 0-100
    benchmark_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_dept_metric_date UNIQUE (department, metric_name, benchmark_date)
);

CREATE INDEX idx_benchmarks_dept ON department_benchmarks(department);
CREATE INDEX idx_benchmarks_metric ON department_benchmarks(metric_name);

-- Temporal Snapshots (Historical data points)
CREATE TABLE temporal_snapshots (
    id SERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    total_actors INT DEFAULT 0,
    total_interactions INT DEFAULT 0,
    avg_influence_score FLOAT DEFAULT 0,
    active_communities INT DEFAULT 0,
    network_density FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_snapshot_date UNIQUE (snapshot_date)
);

CREATE INDEX idx_snapshots_date ON temporal_snapshots(snapshot_date);

-- Rankings
CREATE TABLE rankings (
    id SERIAL PRIMARY KEY,
    ranking_type VARCHAR(50) NOT NULL, -- 'top_collaborators', 'most_connected', 'fastest_responders'
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    rank_position INT NOT NULL,
    score FLOAT DEFAULT 0,
    ranking_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_ranking_type_actor_date UNIQUE (ranking_type, actor_id, ranking_date)
);

CREATE INDEX idx_rankings_type ON rankings(ranking_type);
CREATE INDEX idx_rankings_actor ON rankings(actor_id);

-- ============================================================================
-- EXPORT & REPORTING TABLES
-- ============================================================================

-- Scheduled Reports
CREATE TABLE scheduled_reports (
    id SERIAL PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'executive_summary', 'department_analysis', 'custom'
    schedule_frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    recipients TEXT, -- JSON array of email addresses
    filters TEXT, -- JSON object with filter criteria
    is_active BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheduled_reports_active ON scheduled_reports(is_active);

-- Report Templates
CREATE TABLE report_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'pdf', 'csv', 'excel'
    sections TEXT, -- JSON array of section configurations
    metrics TEXT, -- JSON array of metrics to include
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Export History (Audit trail)
CREATE TABLE export_history (
    id SERIAL PRIMARY KEY,
    export_type VARCHAR(50) NOT NULL, -- 'pdf', 'csv', 'excel'
    exported_by VARCHAR(255),
    record_count INT DEFAULT 0,
    file_size_kb INT DEFAULT 0,
    filters_applied TEXT, -- JSON object
    export_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_export_history_timestamp ON export_history(export_timestamp);

-- ============================================================================
-- BATCH PROCESSING TABLES (For Large-Scale Operations)
-- ============================================================================

-- Batch Jobs: Track large-scale processing jobs
CREATE TABLE batch_jobs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- 'user_extraction', 'email_ingestion', 'teams_ingestion', 'analytics_calculation'
    total_items INT DEFAULT 0,
    items_processed INT DEFAULT 0,
    batch_size INT DEFAULT 100,
    progress_pct FLOAT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    config TEXT, -- JSON configuration
    metadata TEXT, -- JSON results/errors
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX idx_batch_jobs_type ON batch_jobs(job_type);

-- Active Directory Groups: Store AD group information
CREATE TABLE ad_groups (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(255) UNIQUE NOT NULL, -- Azure AD Group Object ID
    group_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    member_count INT DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    last_synced TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ad_groups_name ON ad_groups(group_name);
CREATE INDEX idx_ad_groups_enabled ON ad_groups(is_enabled);

-- AD Group Members: Map users to AD groups
CREATE TABLE ad_group_members (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES ad_groups(id) ON DELETE CASCADE,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_group_member UNIQUE (group_id, actor_id)
);

CREATE INDEX idx_ad_group_members_group ON ad_group_members(group_id);
CREATE INDEX idx_ad_group_members_actor ON ad_group_members(actor_id);

-- Extraction Scopes: Define which users/groups to extract
CREATE TABLE extraction_scopes (
    id SERIAL PRIMARY KEY,
    scope_name VARCHAR(255) NOT NULL,
    scope_type VARCHAR(50) NOT NULL, -- 'all_users', 'ad_group', 'department', 'custom_filter'
    filter_config TEXT, -- JSON configuration for filtering
    user_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_extraction_scopes_type ON extraction_scopes(scope_type);
CREATE INDEX idx_extraction_scopes_active ON extraction_scopes(is_active);

-- ============================================================================
-- GAMIFICATION TABLES
-- ============================================================================

-- Achievement Badges
CREATE TABLE achievement_badges (
    id SERIAL PRIMARY KEY,
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    badge_icon VARCHAR(50), -- Emoji or icon identifier
    criteria TEXT, -- JSON object describing earning criteria
    points INT DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Badges Earned (User achievements)
CREATE TABLE badges_earned (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    badge_id INT NOT NULL REFERENCES achievement_badges(id) ON DELETE CASCADE,
    earned_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_actor_badge UNIQUE (actor_id, badge_id)
);

CREATE INDEX idx_badges_earned_actor ON badges_earned(actor_id);

-- Network Goals
CREATE TABLE network_goals (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- 'expand_network', 'cross_department', 'response_time'
    goal_description TEXT,
    target_value FLOAT NOT NULL,
    current_value FLOAT DEFAULT 0,
    progress_pct FLOAT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goals_actor ON network_goals(actor_id);
CREATE INDEX idx_goals_status ON network_goals(status);

-- Connection Suggestions
CREATE TABLE connection_suggestions (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    suggested_actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    suggestion_reason TEXT,
    shared_connections INT DEFAULT 0,
    relevance_score FLOAT DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed'
    suggested_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_actor_suggestion UNIQUE (actor_id, suggested_actor_id)
);

CREATE INDEX idx_suggestions_actor ON connection_suggestions(actor_id);
CREATE INDEX idx_suggestions_status ON connection_suggestions(status);

-- ============================================================================
-- SEED INITIAL DATA
-- ============================================================================

-- Insert default achievement badges
INSERT INTO achievement_badges (badge_name, badge_description, badge_icon, criteria, points, rarity) VALUES
('Conector Estrella', 'Conecta con más de 50 personas diferentes en un mes', '⭐', '{"min_connections": 50, "period": "monthly"}', 100, 'rare'),
('Respuesta Rápida', 'Mantén un tiempo de respuesta promedio menor a 2 horas', '⚡', '{"max_avg_response_hours": 2}', 50, 'common'),
('Puente Organizacional', 'Conecta 3 o más comunidades diferentes', '🌉', '{"min_communities_connected": 3}', 200, 'epic'),
('Colaborador Activo', 'Participa en más de 20 reuniones en un mes', '🤝', '{"min_meetings": 20, "period": "monthly"}', 75, 'common'),
('Mentor de Red', 'Ayuda a 5 personas a expandir su red', '🎓', '{"mentees_helped": 5}', 150, 'rare');

-- Insert default report templates
INSERT INTO report_templates (template_name, template_type, sections, metrics, is_default) VALUES
('Executive Summary', 'pdf', '["overview", "top_influencers", "trends", "alerts"]', '["total_users", "avg_influence", "top_10", "churn_risk"]', TRUE),
('Department Analysis', 'pdf', '["department_overview", "benchmarks", "collaboration_matrix"]', '["dept_metrics", "cross_dept_collab", "efficiency"]', TRUE),
('Full Data Export', 'csv', '["all_actors", "all_interactions"]', '["all_fields"]', TRUE);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
