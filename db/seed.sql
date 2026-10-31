-- Sample data: replace with Anora's real times (or delete and use the admin page)
-- Make sure the emoji below are read as UTF-8 and not mangled by the client's default charset
SET NAMES utf8mb4;
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
