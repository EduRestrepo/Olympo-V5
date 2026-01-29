-- Clear existing data
TRUNCATE TABLE teams_call_records RESTART IDENTITY CASCADE;
TRUNCATE TABLE influence_links RESTART IDENTITY CASCADE;
TRUNCATE TABLE interactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE response_times RESTART IDENTITY CASCADE;
TRUNCATE TABLE actors RESTART IDENTITY CASCADE;
TRUNCATE TABLE channel_totals RESTART IDENTITY CASCADE;
TRUNCATE TABLE tone_index_daily RESTART IDENTITY CASCADE;
TRUNCATE TABLE network_pulse_daily RESTART IDENTITY CASCADE;

-- 1. Seed Actors (120 Users to meet requirement)
INSERT INTO actors (name, role, badge, department, country, escalation_score, email) VALUES
('Elena Fisher', 'CEO', '♚', 'Executive', 'USA', 0, 'elena.fisher@olympus.com'),
('Nathan Drake', 'CTO', '♛', 'Technology', 'USA', 2, 'nathan.drake@olympus.com'),
('Victor Sullivan', 'VP Sales', '♜', 'Sales', 'USA', 5, 'sully@olympus.com'),
('Chloe Frazer', 'Head of Marketing', '♜', 'Marketing', 'UK', 3, 'chloe.frazer@olympus.com'),
('Sam Drake', 'Lead Developer', '♞', 'Technology', 'USA', 1, 'sam.drake@olympus.com'),
('Charlie Cutter', 'Security Specialist', '♗', 'Security', 'UK', 0, 'cutter@olympus.com'),
('Rafe Adler', 'Project Manager', '♞', 'Projects', 'USA', 4, 'rafe.adler@olympus.com'),
('Nadine Ross', 'Operations Lead', '♗', 'Operations', 'South Africa', 2, 'nadine.ross@olympus.com'),
('Harry Flynn', 'Sales Rep', '♙', 'Sales', 'UK', 8, 'harry.flynn@olympus.com'),
('Marlowe', 'HR Director', '♙', 'HR', 'UK', 4, 'marlowe@olympus.com');

-- Bulk Actors (100+ Generic Users)
INSERT INTO actors (name, role, badge, department, country, escalation_score, email)
SELECT 
  'Employee ' || generate_series, 
  CASE (generate_series % 5) 
    WHEN 0 THEN 'Developer' 
    WHEN 1 THEN 'Analyst' 
    WHEN 2 THEN 'Associate' 
    WHEN 3 THEN 'Manager' 
    ELSE 'Director' 
  END, 
  CASE (floor(random() * 3))
    WHEN 0 THEN '♙'
    WHEN 1 THEN '♗'
    ELSE '♞'
  END,
  CASE (generate_series % 4) 
    WHEN 0 THEN 'Technology' 
    WHEN 1 THEN 'Sales' 
    WHEN 2 THEN 'Marketing' 
    ELSE 'Operations' 
  END,
  CASE (generate_series % 3) 
    WHEN 0 THEN 'USA' 
    WHEN 1 THEN 'UK' 
    ELSE 'Germany' 
  END,
  floor(random() * 5)::int,
  'employee' || generate_series || '@olympus.com'
FROM generate_series(11, 120);

-- 2. Seed Channel Totals
INSERT INTO channel_totals (channel, total_count) VALUES
('Email', 125000),
('Chat', 450000),
('Calls', 34000),
('Meetings', 8500);

-- 3. Seed Interactions (Randomized but dense)
INSERT INTO interactions (source_id, target_id, channel, volume)
SELECT 
  (random() * 119 + 1)::int, 
  (random() * 119 + 1)::int, 
  CASE (floor(random() * 4)) 
    WHEN 0 THEN 'Email' 
    WHEN 1 THEN 'Chat' 
    WHEN 2 THEN 'Calls' 
    ELSE 'Meetings' 
  END,
  (random() * 50 + 1)::int
FROM generate_series(1, 1000)
WHERE (random() * 119 + 1)::int != (random() * 119 + 1)::int; -- Start/End nodes might be same in pure random math, ignored by conflict usually but good to keep simple.

-- 4. Seed Influence Links (High Value Graph)
INSERT INTO influence_links (source_id, target_id, weight)
SELECT 
  (random() * 119 + 1)::int, 
  (random() * 119 + 1)::int, 
  (random() * 1)::numeric(3,2)
FROM generate_series(1, 500);

-- 5. Seed Tone Index
INSERT INTO tone_index_daily (date, score) VALUES
(CURRENT_DATE - INTERVAL '9 days', 75), (CURRENT_DATE - INTERVAL '8 days', 78),
(CURRENT_DATE - INTERVAL '7 days', 72), (CURRENT_DATE - INTERVAL '6 days', 80),
(CURRENT_DATE - INTERVAL '5 days', 85), (CURRENT_DATE - INTERVAL '4 days', 82),
(CURRENT_DATE - INTERVAL '3 days', 88), (CURRENT_DATE - INTERVAL '2 days', 90),
(CURRENT_DATE - INTERVAL '1 days', 87), (CURRENT_DATE, 89);

-- 6. Seed Network Pulse
INSERT INTO network_pulse_daily (date, activity_level) VALUES
(CURRENT_DATE - INTERVAL '9 days', 3000), (CURRENT_DATE - INTERVAL '8 days', 4500),
(CURRENT_DATE - INTERVAL '7 days', 2800), (CURRENT_DATE - INTERVAL '6 days', 5000),
(CURRENT_DATE - INTERVAL '5 days', 6000), (CURRENT_DATE - INTERVAL '4 days', 5500),
(CURRENT_DATE - INTERVAL '3 days', 7000), (CURRENT_DATE - INTERVAL '2 days', 8000),
(CURRENT_DATE - INTERVAL '1 days', 6500), (CURRENT_DATE, 7500);
