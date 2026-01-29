-- Drop tables if they exist
DROP VIEW IF EXISTS teams_influence_metrics;
DROP TABLE IF EXISTS teams_call_records;
DROP TABLE IF EXISTS tone_index_daily;
DROP TABLE IF EXISTS influence_links;
DROP TABLE IF EXISTS response_times;
DROP TABLE IF EXISTS channel_totals;
DROP TABLE IF EXISTS interactions;
DROP TABLE IF EXISTS actors;

-- Actors Table
CREATE TABLE actors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'Manager', 'Developer', 'Designer', etc.
    badge VARCHAR(10) NOT NULL, -- '♚', '♛', '♜', '♞', '♗', '♙'
    email VARCHAR(255) UNIQUE, 
    department VARCHAR(255),
    country VARCHAR(100),
    escalation_score INT DEFAULT 0 -- Count of 'political' escalations (CC > To)
);

-- Interactions Table (Aggregated)
CREATE TABLE interactions (
    id SERIAL PRIMARY KEY,
    source_id INT NOT NULL REFERENCES actors(id),
    target_id INT NOT NULL REFERENCES actors(id),
    channel VARCHAR(20) NOT NULL, -- 'Email', 'Chat', 'Calls', 'Meetings'
    volume INT NOT NULL DEFAULT 0,
    interaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT interactions_unique_daily UNIQUE (source_id, target_id, channel, interaction_date)
);

-- Channel Totals (Global aggregation for speed, or can be view)
-- We will store daily snapshots or just total counters for the dashboard
CREATE TABLE channel_totals (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(20) NOT NULL UNIQUE,
    total_count INT NOT NULL DEFAULT 0
);

-- Response Times
CREATE TABLE response_times (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL REFERENCES actors(id),
    avg_response_seconds INT NOT NULL DEFAULT 0 -- in seconds
);

-- Influence Links (Graph Edges with Weight)
CREATE TABLE influence_links (
    id SERIAL PRIMARY KEY,
    source_id INT NOT NULL REFERENCES actors(id),
    target_id INT NOT NULL REFERENCES actors(id),
    weight FLOAT NOT NULL CHECK (weight >= 0 AND weight <= 1)
);

-- Tone Index Daily
CREATE TABLE tone_index_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    score FLOAT NOT NULL CHECK (score >= 0 AND score <= 100)
);

-- Network Pulse (Activity over time)
CREATE TABLE network_pulse_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    activity_level INT NOT NULL
);

-- Teams Call Records (Metadata from Microsoft Teams)
CREATE TABLE teams_call_records (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES actors(id),
    call_type VARCHAR(20) NOT NULL, -- 'groupCall', 'peerToPeer'
    duration_seconds INT NOT NULL,
    participant_count INT NOT NULL DEFAULT 1,
    is_organizer BOOLEAN DEFAULT FALSE,
    used_video BOOLEAN DEFAULT FALSE,
    used_screenshare BOOLEAN DEFAULT FALSE,
    call_timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_teams_user ON teams_call_records(user_id);
CREATE INDEX idx_teams_timestamp ON teams_call_records(call_timestamp);

-- Teams Influence Metrics View (Aggregated for last 30 days)
CREATE VIEW teams_influence_metrics AS
SELECT 
    a.id,
    a.name,
    COUNT(tcr.id) as total_meetings,
    COALESCE(AVG(tcr.participant_count), 0) as avg_participants,
    COALESCE(SUM(tcr.duration_seconds) / 3600.0, 0) as total_duration_hours,
    SUM(CASE WHEN tcr.is_organizer THEN 1 ELSE 0 END) as meetings_organized,
    SUM(CASE WHEN tcr.used_video THEN 1 ELSE 0 END) as video_calls,
    SUM(CASE WHEN tcr.used_screenshare THEN 1 ELSE 0 END) as screenshare_sessions
FROM actors a
LEFT JOIN teams_call_records tcr ON a.id = tcr.user_id 
    AND tcr.call_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY a.id, a.name;

-- Settings Table (Key-Value)
CREATE TABLE settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Settings
INSERT INTO settings (key, value, description) VALUES 
('app_env', 'dev', 'Environment: dev or prod'),
('app_debug', 'true', 'Debug mode: true or false'),
('ms_graph_tenant_id', '', 'Microsoft Graph Tenant ID'),
('ms_graph_client_id', '', 'Microsoft Graph Client ID'),
('ms_graph_client_secret', '', 'Microsoft Graph Client Secret'),
('extraction_lookback_days', '30', 'Days to look back for data extraction (e.g., 30)'),
('extraction_max_users', '100', 'Maximum users to fetch from Graph'),
('excluded_users', '', 'Comma-separated emails to ignore'),
('mandatory_users', '', 'Comma-separated emails to force include'),
('influence_weight_email', '0.6', 'Global weight for email interactions'),
('influence_weight_teams', '0.4', 'Global weight for teams interactions'),
('w_email_vol', '0.6', 'Weight of Email Volume'),
('w_email_resp', '0.4', 'Weight of Response Time'),
('w_teams_freq', '0.30', 'Weight of Teams Frequency'),
('w_teams_audience', '0.25', 'Weight of Teams Audience'),
('w_teams_duration', '0.20', 'Weight of Teams Duration'),
('w_teams_organizer', '0.15', 'Weight of Teams Organizer'),
('w_teams_video', '0.10', 'Weight of Teams Video'),
('threshold_email_vol', '500', 'Target monthly emails for 100% score'),
('threshold_teams_freq', '50', 'Target monthly meetings for 100% score');
