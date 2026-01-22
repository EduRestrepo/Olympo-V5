-- Seed Actors
INSERT INTO actors (name, role, badge) VALUES
('Elena Fisher', 'CEO', '♚'),
('Nathan Drake', 'CTO', '♛'),
('Victor Sullivan', 'VP Sales', '♜'),
('Chloe Frazer', 'Head of Marketing', '♜'),
('Sam Drake', 'Lead Developer', '♞'),
('Charlie Cutter', 'Security Specialist', '♗'),
('Rafe Adler', 'Project Manager', '♞'),
('Nadine Ross', 'Operations Lead', '♗'),
('Harry Flynn', 'Sales Rep', '♙'),
('Marlowe', 'HR Director', '♙');

-- Seed Channel Totals
INSERT INTO channel_totals (channel, total_count) VALUES
('Email', 12500),
('Chat', 45000),
('Calls', 3400),
('Meetings', 850);

-- Seed Response Times (Seconds)
-- 300s = 5m, 3600s = 1h
INSERT INTO response_times (actor_id, avg_response_seconds) VALUES
(1, 1200),
(2, 300),
(3, 5400),
(4, 2400),
(5, 180),
(6, 600),
(7, 900),
(8, 3600),
(9, 7200),
(10, 4800);

-- Seed Interactions (Sample)
INSERT INTO interactions (source_id, target_id, channel, volume) VALUES
(1, 2, 'Email', 50),
(1, 3, 'Meetings', 10),
(2, 5, 'Chat', 200),
(5, 2, 'Chat', 180),
(3, 4, 'Calls', 20),
(4, 3, 'Email', 30),
(6, 2, 'Chat', 50),
(7, 5, 'Meetings', 5),
(8, 1, 'Email', 10),
(9, 3, 'Calls', 15),
(10, 1, 'Meetings', 2);

-- Seed Influence Links (Graph)
INSERT INTO influence_links (source_id, target_id, weight) VALUES
(1, 2, 0.9), (2, 1, 0.8),
(1, 3, 0.7), (3, 1, 0.6),
(2, 5, 0.95), (5, 2, 0.9),
(3, 4, 0.5), (4, 3, 0.6),
(6, 2, 0.4),
(7, 5, 0.7),
(8, 1, 0.3),
(9, 3, 0.4),
(10, 1, 0.5),
(2, 6, 0.6),
(5, 7, 0.8);

-- Seed Tone Index (Last 10 days)
INSERT INTO tone_index_daily (date, score) VALUES
(CURRENT_DATE - INTERVAL '9 days', 75),
(CURRENT_DATE - INTERVAL '8 days', 78),
(CURRENT_DATE - INTERVAL '7 days', 72),
(CURRENT_DATE - INTERVAL '6 days', 80),
(CURRENT_DATE - INTERVAL '5 days', 85),
(CURRENT_DATE - INTERVAL '4 days', 82),
(CURRENT_DATE - INTERVAL '3 days', 88),
(CURRENT_DATE - INTERVAL '2 days', 90),
(CURRENT_DATE - INTERVAL '1 days', 87),
(CURRENT_DATE, 89);

-- Seed Network Pulse (Last 10 days)
INSERT INTO network_pulse_daily (date, activity_level) VALUES
(CURRENT_DATE - INTERVAL '9 days', 300),
(CURRENT_DATE - INTERVAL '8 days', 450),
(CURRENT_DATE - INTERVAL '7 days', 280),
(CURRENT_DATE - INTERVAL '6 days', 500),
(CURRENT_DATE - INTERVAL '5 days', 600),
(CURRENT_DATE - INTERVAL '4 days', 550),
(CURRENT_DATE - INTERVAL '3 days', 700),
(CURRENT_DATE - INTERVAL '2 days', 800),
(CURRENT_DATE - INTERVAL '1 days', 650),
(CURRENT_DATE, 750);

-- Seed Teams Call Records (Last 30 days)
-- Elena Fisher (CEO) - High meeting volume, mostly organizer
INSERT INTO teams_call_records (user_id, call_type, duration_seconds, participant_count, is_organizer, used_video, used_screenshare, call_timestamp) VALUES
(1, 'groupCall', 3600, 12, true, true, true, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(1, 'groupCall', 2700, 8, true, true, false, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(1, 'peerToPeer', 1800, 2, false, true, false, CURRENT_TIMESTAMP - INTERVAL '7 days'),
(1, 'groupCall', 5400, 15, true, true, true, CURRENT_TIMESTAMP - INTERVAL '10 days'),
(1, 'groupCall', 2400, 6, true, true, false, CURRENT_TIMESTAMP - INTERVAL '14 days');

-- Nathan Drake (CTO) - Very high activity, technical meetings
INSERT INTO teams_call_records (user_id, call_type, duration_seconds, participant_count, is_organizer, used_video, used_screenshare, call_timestamp) VALUES
(2, 'groupCall', 4200, 10, true, true, true, CURRENT_TIMESTAMP - INTERVAL '1 days'),
(2, 'groupCall', 3600, 8, true, true, true, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 'peerToPeer', 1200, 2, true, true, false, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(2, 'groupCall', 5400, 12, true, true, true, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(2, 'groupCall', 2700, 6, true, true, true, CURRENT_TIMESTAMP - INTERVAL '6 days'),
(2, 'peerToPeer', 900, 2, false, true, false, CURRENT_TIMESTAMP - INTERVAL '8 days'),
(2, 'groupCall', 3000, 9, true, true, true, CURRENT_TIMESTAMP - INTERVAL '11 days');

-- Victor Sullivan (VP Sales) - Moderate meetings, less video
INSERT INTO teams_call_records (user_id, call_type, duration_seconds, participant_count, is_organizer, used_video, used_screenshare, call_timestamp) VALUES
(3, 'groupCall', 2400, 5, false, false, false, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(3, 'peerToPeer', 1800, 2, true, false, false, CURRENT_TIMESTAMP - INTERVAL '7 days'),
(3, 'groupCall', 3000, 8, true, true, true, CURRENT_TIMESTAMP - INTERVAL '12 days');

-- Chloe Frazer (Head of Marketing) - Regular meetings
INSERT INTO teams_call_records (user_id, call_type, duration_seconds, participant_count, is_organizer, used_video, used_screenshare, call_timestamp) VALUES
(4, 'groupCall', 3600, 10, true, true, true, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(4, 'groupCall', 2700, 7, true, true, false, CURRENT_TIMESTAMP - INTERVAL '6 days'),
(4, 'peerToPeer', 1500, 2, false, true, false, CURRENT_TIMESTAMP - INTERVAL '9 days'),
(4, 'groupCall', 4200, 12, true, true, true, CURRENT_TIMESTAMP - INTERVAL '15 days');

-- Sam Drake (Lead Developer) - High technical collaboration
INSERT INTO teams_call_records (user_id, call_type, duration_seconds, participant_count, is_organizer, used_video, used_screenshare, call_timestamp) VALUES
(5, 'groupCall', 3000, 6, true, true, true, CURRENT_TIMESTAMP - INTERVAL '1 days'),
(5, 'peerToPeer', 1800, 2, true, true, true, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(5, 'groupCall', 2400, 5, true, true, true, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(5, 'peerToPeer', 1200, 2, false, true, false, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(5, 'groupCall', 3600, 8, true, true, true, CURRENT_TIMESTAMP - INTERVAL '8 days');

-- Charlie Cutter (Security Specialist) - Lower meeting volume
INSERT INTO teams_call_records (user_id, call_type, duration_seconds, participant_count, is_organizer, used_video, used_screenshare, call_timestamp) VALUES
(6, 'peerToPeer', 1800, 2, false, true, false, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(6, 'groupCall', 2700, 4, false, true, false, CURRENT_TIMESTAMP - INTERVAL '13 days');

-- Rafe Adler (Project Manager) - Moderate organizer activity
INSERT INTO teams_call_records (user_id, call_type, duration_seconds, participant_count, is_organizer, used_video, used_screenshare, call_timestamp) VALUES
(7, 'groupCall', 3600, 9, true, true, true, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(7, 'groupCall', 2400, 6, true, true, false, CURRENT_TIMESTAMP - INTERVAL '8 days'),
(7, 'peerToPeer', 1500, 2, true, true, false, CURRENT_TIMESTAMP - INTERVAL '11 days');

-- Nadine Ross (Operations Lead) - Regular operational meetings
INSERT INTO teams_call_records (user_id, call_type, duration_seconds, participant_count, is_organizer, used_video, used_screenshare, call_timestamp) VALUES
(8, 'groupCall', 2700, 7, true, true, false, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(8, 'groupCall', 3000, 8, false, true, false, CURRENT_TIMESTAMP - INTERVAL '10 days');

-- Harry Flynn (Sales Rep) - Low meeting activity
INSERT INTO teams_call_records (user_id, call_type, duration_seconds, participant_count, is_organizer, used_video, used_screenshare, call_timestamp) VALUES
(9, 'peerToPeer', 1200, 2, false, false, false, CURRENT_TIMESTAMP - INTERVAL '6 days');

-- Marlowe (HR Director) - Moderate HR meetings
INSERT INTO teams_call_records (user_id, call_type, duration_seconds, participant_count, is_organizer, used_video, used_screenshare, call_timestamp) VALUES
(10, 'groupCall', 2400, 5, true, true, false, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(10, 'peerToPeer', 1800, 2, true, true, false, CURRENT_TIMESTAMP - INTERVAL '12 days');
