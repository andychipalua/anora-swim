<?php
declare(strict_types=1);

function event_row(array $r): array
{
    return [
        'id'          => (int) $r['id'],
        'name'        => $r['name'],
        'date'        => $r['event_date'],
        'endDate'     => $r['end_date'],
        'venue'       => $r['venue'],
        'address'     => $r['address'],
        'city'        => $r['city'],
        'course'      => $r['course'],
        'level'       => $r['level'],
        'website'     => $r['website'],
        'notes'       => $r['notes'],
        'recordCount' => isset($r['record_count']) ? (int) $r['record_count'] : 0,
    ];
}

function list_strokes(): never
{
    send_json(db()->query(
        'SELECT slug, name, emoji FROM strokes ORDER BY sort_order, name'
    )->fetchAll());
}

function list_events(): never
{
    $rows = db()->query(
        'SELECT e.*, (SELECT COUNT(*) FROM records r WHERE r.event_id = e.id) AS record_count
         FROM events e
         ORDER BY e.event_date DESC, e.id DESC'
    )->fetchAll();
    send_json(array_map('event_row', $rows));
}

function list_records(?string $stroke): never
{
    $sql = 'SELECT r.id, r.stroke_slug, r.distance, r.course, r.time_seconds, r.race_date,
                   r.round, r.place, r.is_pb, r.notes, r.video_id, r.event_id,
                   e.name AS event_name, e.venue, e.city
            FROM records r
            JOIN events e ON e.id = r.event_id'
        . ($stroke !== null ? ' WHERE r.stroke_slug = ?' : '')
        . ' ORDER BY r.race_date DESC, r.distance, r.time_seconds';
    $stmt = db()->prepare($sql);
    $stmt->execute($stroke !== null ? [$stroke] : []);

    send_json(array_map(static function (array $r): array {
        $where = implode(', ', array_filter([$r['venue'], $r['city']]));
        return [
            'id'          => (int) $r['id'],
            'stroke'      => $r['stroke_slug'],
            'distance'    => (int) $r['distance'],
            'course'      => $r['course'],
            'timeSeconds' => (float) $r['time_seconds'],
            'date'        => $r['race_date'],
            'eventId'     => (int) $r['event_id'],
            'meet'        => $r['event_name'],
            'location'    => $where !== '' ? $where : null,
            'round'       => $r['round'],
            'place'       => $r['place'] !== null ? (int) $r['place'] : null,
            'isPb'        => (bool) $r['is_pb'],
            'notes'       => $r['notes'],
            'videoId'     => $r['video_id'] !== null ? (int) $r['video_id'] : null,
        ];
    }, $stmt->fetchAll()));
}

function list_videos(?string $stroke): never
{
    $sql = 'SELECT id, title, youtube_id, stroke_slug, video_date, event_id FROM videos'
        . ($stroke !== null ? ' WHERE stroke_slug = ?' : '')
        . ' ORDER BY video_date DESC, id DESC';
    $stmt = db()->prepare($sql);
    $stmt->execute($stroke !== null ? [$stroke] : []);

    send_json(array_map(static fn(array $r): array => [
        'id'        => (int) $r['id'],
        'title'     => $r['title'],
        'youtubeId' => $r['youtube_id'],
        'stroke'    => $r['stroke_slug'],
        'date'      => $r['video_date'],
        'eventId'   => $r['event_id'] !== null ? (int) $r['event_id'] : null,
    ], $stmt->fetchAll()));
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Validates the event fields shared by create and update. Errors go into $e. */
function parse_event(array $d, array &$e): array
{
    $name    = clean_str($d, 'name', 200, $e, true);
    $date    = clean_date($d, 'date', $e, true);
    $endDate = clean_date($d, 'endDate', $e);
    if ($date !== null && $endDate !== null && $endDate < $date) {
        $e['endDate'] = 'End date must be on or after the start date';
    }
    $venue   = clean_str($d, 'venue', 150, $e);
    $address = clean_str($d, 'address', 255, $e);
    $city    = clean_str($d, 'city', 100, $e);
    $course  = clean_enum($d, 'course', COURSES, $e);
    $level   = clean_enum($d, 'level', LEVELS, $e, 'Club');
    $website = clean_str($d, 'website', 255, $e);
    if ($website !== null && (!preg_match('#^https?://#i', $website)
            || filter_var($website, FILTER_VALIDATE_URL) === false)) {
        $e['website'] = 'Must be a full link starting with http:// or https://';
    }
    $notes = clean_str($d, 'notes', 2000, $e);

    return [$name, $date, $endDate, $venue, $address, $city, $course, $level, $website, $notes];
}

function fetch_event_row(PDO $pdo, int $id): array|false
{
    $stmt = $pdo->prepare(
        'SELECT e.*, (SELECT COUNT(*) FROM records r WHERE r.event_id = e.id) AS record_count
         FROM events e WHERE e.id = ?'
    );
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function create_event(): never
{
    $d = json_body();
    $e = [];
    $fields = parse_event($d, $e);
    if ($e) {
        validation_failed($e);
    }

    $pdo = db();
    $pdo->prepare(
        'INSERT INTO events (name, event_date, end_date, venue, address, city, course, level, website, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute($fields);

    send_json(event_row(fetch_event_row($pdo, (int) $pdo->lastInsertId())), 201);
}

/** PUT /api/events/{id}: replaces all editable fields of an event. */
function update_event(int $id): never
{
    $pdo = db();
    if (fetch_event_row($pdo, $id) === false) {
        send_json(['error' => 'Event not found'], 404);
    }

    $d = json_body();
    $e = [];
    $fields = parse_event($d, $e);
    if ($e) {
        validation_failed($e);
    }

    $pdo->prepare(
        'UPDATE events SET name = ?, event_date = ?, end_date = ?, venue = ?, address = ?,
                           city = ?, course = ?, level = ?, website = ?, notes = ?
         WHERE id = ?'
    )->execute([...$fields, $id]);

    send_json(event_row(fetch_event_row($pdo, $id)));
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

/**
 * Validates the "videos" list in a request body.
 * Each item: { youtubeId (required), title?, strokeSlug? }.
 * Errors use keys like "videos.2.youtubeId" so the UI can point at the right row.
 */
function parse_videos(array $d, array &$errors, bool $required = false): array
{
    $raw = $d['videos'] ?? null;
    if ($raw === null || $raw === []) {
        if ($required) {
            $errors['videos'] = 'Add at least one video';
        }
        return [];
    }
    if (!is_array($raw) || !array_is_list($raw)) {
        $errors['videos'] = 'Must be a list of videos';
        return [];
    }
    if (count($raw) > 20) {
        $errors['videos'] = 'At most 20 videos at a time';
        return [];
    }

    $out = [];
    foreach ($raw as $i => $item) {
        if (!is_array($item)) {
            $errors["videos.$i"] = 'Invalid video';
            continue;
        }
        $sub = [];
        $youtubeId = clean_str($item, 'youtubeId', 20, $sub, true);
        if ($youtubeId !== null && !preg_match('/^[A-Za-z0-9_-]{11}$/', $youtubeId)) {
            $sub['youtubeId'] = 'Not a valid YouTube video link';
        }
        $title = clean_str($item, 'title', 200, $sub);
        $strokeSlug = clean_str($item, 'strokeSlug', 30, $sub);
        foreach ($sub as $field => $msg) {
            $errors["videos.$i.$field"] = $msg;
        }
        $out[$i] = ['youtubeId' => $youtubeId, 'title' => $title, 'strokeSlug' => $strokeSlug];
    }
    return $out;
}

/** Inserts a video, or reuses the existing row for the same YouTube id. Returns the video id. */
function save_video(PDO $pdo, string $youtubeId, string $title, ?string $strokeSlug, int $eventId, ?string $date): int
{
    $find = $pdo->prepare('SELECT id, event_id FROM videos WHERE youtube_id = ? LIMIT 1');
    $find->execute([$youtubeId]);
    $row = $find->fetch();
    if ($row !== false) {
        if ($row['event_id'] === null) {
            $pdo->prepare('UPDATE videos SET event_id = ? WHERE id = ?')
                ->execute([$eventId, (int) $row['id']]);
        }
        return (int) $row['id'];
    }
    $pdo->prepare(
        'INSERT INTO videos (title, youtube_id, stroke_slug, video_date, event_id) VALUES (?, ?, ?, ?, ?)'
    )->execute([$title, $youtubeId, $strokeSlug, $date, $eventId]);
    return (int) $pdo->lastInsertId();
}

/** Add one or more videos to an event, without needing a swim record. */
function create_videos(): never
{
    $d = json_body();
    $e = [];
    $pdo = db();

    $eventId = clean_int($d, 'eventId', 1, PHP_INT_MAX, $e, true);
    $eventName = null;
    $eventDate = null;
    if ($eventId !== null) {
        $ev = $pdo->prepare('SELECT name, event_date FROM events WHERE id = ?');
        $ev->execute([$eventId]);
        $row = $ev->fetch();
        if ($row === false) {
            $e['eventId'] = 'Event not found';
        } else {
            $eventName = $row['name'];
            $eventDate = $row['event_date'];
        }
    }

    $videos = parse_videos($d, $e, true);

    $strokeNames = $pdo->query('SELECT slug, name FROM strokes')->fetchAll(PDO::FETCH_KEY_PAIR);
    foreach ($videos as $i => $v) {
        if ($v['strokeSlug'] !== null && !isset($strokeNames[$v['strokeSlug']])) {
            $e["videos.$i.strokeSlug"] = 'Unknown stroke';
        }
    }

    if ($e) {
        validation_failed($e);
    }

    try {
        $pdo->beginTransaction();
        $videoIds = [];
        foreach ($videos as $v) {
            $strokeName = $v['strokeSlug'] !== null ? $strokeNames[$v['strokeSlug']] : null;
            $title = $v['title'] ?? ($strokeName !== null ? "$strokeName - $eventName" : $eventName);
            $videoIds[] = save_video($pdo, $v['youtubeId'], $title, $v['strokeSlug'], $eventId, $eventDate);
        }
        $pdo->commit();
    } catch (Throwable $ex) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $ex;
    }

    send_json(['videoIds' => $videoIds], 201);
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

/** Validates the swim fields shared by create and update. Errors go into $e. */
function parse_record(array $d, array &$e, PDO $pdo): array
{
    // Stroke must exist
    $strokeSlug = clean_str($d, 'strokeSlug', 30, $e, true);
    $strokeName = null;
    if ($strokeSlug !== null) {
        $s = $pdo->prepare('SELECT name FROM strokes WHERE slug = ?');
        $s->execute([$strokeSlug]);
        $strokeName = $s->fetchColumn();
        if ($strokeName === false) {
            $e['strokeSlug'] = 'Unknown stroke';
        }
    }

    $distance = clean_int($d, 'distance', 25, 1500, $e, true);
    $course   = clean_enum($d, 'course', COURSES, $e);
    if ($course === null && !isset($e['course'])) {
        $e['course'] = 'Required';
    }

    $time = $d['timeSeconds'] ?? null;
    if (!is_numeric($time) || (float) $time <= 0 || (float) $time > 7200) {
        $e['timeSeconds'] = 'Enter a time greater than 0';
        $time = null;
    } else {
        $time = round((float) $time, 2);
    }

    // Event must exist; the swim date defaults to the event's first day
    $eventId = clean_int($d, 'eventId', 1, PHP_INT_MAX, $e, true);
    $eventName = null;
    $eventDate = null;
    if ($eventId !== null) {
        $ev = $pdo->prepare('SELECT name, event_date FROM events WHERE id = ?');
        $ev->execute([$eventId]);
        $row = $ev->fetch();
        if ($row === false) {
            $e['eventId'] = 'Event not found';
        } else {
            $eventName = $row['name'];
            $eventDate = $row['event_date'];
        }
    }

    return [
        'strokeSlug' => $strokeSlug,
        'strokeName' => $strokeName,
        'distance'   => $distance,
        'course'     => $course,
        'time'       => $time,
        'eventId'    => $eventId,
        'eventName'  => $eventName,
        'date'       => clean_date($d, 'date', $e) ?? $eventDate,
        'round'      => clean_enum($d, 'round', ROUNDS, $e, 'Heat'),
        'place'      => clean_int($d, 'place', 1, 999, $e),
        'isPb'       => filter_var($d['isPb'] ?? false, FILTER_VALIDATE_BOOLEAN),
        'notes'      => clean_str($d, 'notes', 2000, $e),
    ];
}

function create_record(): never
{
    $d = json_body();
    $e = [];
    $pdo = db();

    $r = parse_record($d, $e, $pdo);

    // Any number of videos; they are attached to the event, and the first one to this swim
    $videos = parse_videos($d, $e);

    if ($e) {
        validation_failed($e);
    }

    try {
        $pdo->beginTransaction();

        $videoIds = [];
        foreach ($videos as $v) {
            $title = $v['title'] ?? sprintf('%dm %s - %s', $r['distance'], $r['strokeName'], $r['eventName']);
            $videoIds[] = save_video($pdo, $v['youtubeId'], $title, $r['strokeSlug'], $r['eventId'], $r['date']);
        }
        $primaryVideoId = $videoIds[0] ?? null;

        $pdo->prepare(
            'INSERT INTO records
               (stroke_slug, distance, course, time_seconds, race_date, event_id,
                round, place, is_pb, notes, video_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $r['strokeSlug'], $r['distance'], $r['course'], $r['time'], $r['date'], $r['eventId'],
            $r['round'], $r['place'], $r['isPb'] ? 1 : 0, $r['notes'], $primaryVideoId,
        ]);
        $id = (int) $pdo->lastInsertId();

        $pdo->commit();
    } catch (Throwable $ex) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $ex;
    }

    send_json(['id' => $id, 'videoIds' => $videoIds], 201);
}

/**
 * PUT /api/records/{id}: replaces the swim fields of a record.
 * Linked videos are left alone (manage those with the videos endpoint).
 */
function update_record(int $id): never
{
    $pdo = db();
    $exists = $pdo->prepare('SELECT 1 FROM records WHERE id = ?');
    $exists->execute([$id]);
    if ($exists->fetchColumn() === false) {
        send_json(['error' => 'Record not found'], 404);
    }

    $d = json_body();
    $e = [];
    $r = parse_record($d, $e, $pdo);
    if ($e) {
        validation_failed($e);
    }

    $pdo->prepare(
        'UPDATE records
         SET stroke_slug = ?, distance = ?, course = ?, time_seconds = ?, race_date = ?, event_id = ?,
             round = ?, place = ?, is_pb = ?, notes = ?
         WHERE id = ?'
    )->execute([
        $r['strokeSlug'], $r['distance'], $r['course'], $r['time'], $r['date'], $r['eventId'],
        $r['round'], $r['place'], $r['isPb'] ? 1 : 0, $r['notes'], $id,
    ]);

    send_json(['id' => $id]);
}
