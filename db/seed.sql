-- Sample data: replace with Anora's real times (or delete and use the admin page)
USE anora_swim;

INSERT INTO strokes (slug, name, emoji, sort_order) VALUES
  ('freestyle',    'Freestyle',         '🏊', 1),
  ('backstroke',   'Backstroke',        '🌊', 2),
  ('breaststroke', 'Breaststroke',      '🐸', 3),
  ('butterfly',    'Butterfly',         '🦋', 4),
  ('im',           'Individual Medley', '🏅', 5)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO events (id, name, event_date, end_date, venue, address, city, course, level) VALUES
  (1, 'Club Championships', '2026-03-14', NULL,         'Home Pool Aquatic Centre', '1 Pool Road',      'Brisbane', 'SCM', 'Club'),
  (2, 'Regional Meet',      '2026-05-02', '2026-05-03', 'Regional Aquatic Centre',  '25 Lap Street',    'Ipswich',  'SCM', 'Regional'),
  (3, 'Summer Open',        '2026-06-20', NULL,         'City Pool',                '10 Splash Avenue', 'Brisbane', 'SCM', 'Club'),
  (4, 'State Qualifier',    '2026-08-09', NULL,         'State Aquatic Centre',     '100 Water Way',    'Brisbane', 'LCM', 'State');

INSERT INTO videos (id, title, youtube_id, stroke_slug, video_date, event_id) VALUES
  (1, '50m Freestyle - Club Championships', 'dQw4w9WgXcQ', 'freestyle', '2026-03-14', 1);

INSERT INTO records (stroke_slug, distance, course, time_seconds, race_date, event_id, round, place, is_pb, video_id) VALUES
  ('freestyle',    50,  'SCM', 31.45, '2026-03-14', 1, 'Final', 2,    1, 1),
  ('freestyle',    50,  'SCM', 30.80, '2026-06-20', 3, 'Final', 1,    1, NULL),
  ('freestyle',    100, 'SCM', 68.20, '2026-05-02', 2, 'Heat',  NULL, 1, NULL),
  ('freestyle',    100, 'SCM', 66.90, '2026-08-09', 4, 'Final', 5,    1, NULL),
  ('backstroke',   50,  'SCM', 36.80, '2026-03-14', 1, 'Heat',  NULL, 1, NULL),
  ('breaststroke', 50,  'SCM', 41.10, '2026-06-20', 3, 'Final', 4,    1, NULL),
  ('butterfly',    50,  'SCM', 35.90, '2026-06-20', 3, 'Heat',  NULL, 1, NULL),
  ('im',           100, 'SCM', 78.55, '2026-08-09', 4, 'Final', 6,    1, NULL);
