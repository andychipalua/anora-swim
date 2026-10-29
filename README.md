# Anora Swim Records

Swimming records by stroke, with events (meets), progress charts and YouTube videos. Three Docker containers:

| Service | Tech | Port |
| --- | --- | --- |
| `web` | Next.js (App Router + TypeScript) frontend | http://localhost:3000 |
| `api` | PHP 8.3 + Apache REST API (PDO) | http://localhost:8080 |
| `db` | MySQL 8.4 (not exposed outside Docker) | - |

## Run

Requires Docker Desktop.

```bash
copy .env.example .env      # Windows (use "cp" on Mac/Linux)
# edit .env: set ADMIN_PASSWORD, SESSION_SECRET, API_WRITE_KEY and the DB passwords
docker compose up --build
```

Open http://localhost:3000. Docker Compose refuses to start until `ADMIN_PASSWORD`, `SESSION_SECRET` and `API_WRITE_KEY` are set in `.env`.

## Stroke pages

Each stroke page (`/strokes/freestyle`, ...) shows:

- **Progress chart** - one line per distance, date on the x axis and time on the y axis (lower is faster). Click a distance in the legend to show or hide its line; the time scale refits to the lines shown, so a 50m line stays readable next to a 400m one. If a distance has been swum in both short and long course, it appears as two lines (e.g. "50m SCM", "50m LCM") because those times aren't comparable. Hover a dot for the time, date and meet.
- **Records table** and **videos** for that stroke.

## Adding records (admin)

Go to http://localhost:3000/admin/new-record (or the "Admin" link in the footer) and sign in with `ADMIN_PASSWORD`.

1. **Event** - pick an existing event or create a new one (name, start/end date, venue, address, city, pool length, level, website, notes). The swim date is filled in from the event's start date (edit it for a later day of a multi-day meet).
2. **Swim** - stroke, distance, course, time (`31.45` or `1:08.20`), round, finishing place, personal best, notes.
3. **Videos** - add as many YouTube links as you like with "+ Add another video". All are saved with the event; the first is linked to this swim.

To add videos to an event without a swim, use **Add videos to an event** (`/admin/event-videos`): pick the event, add any number of links, and optionally a stroke for each so it also shows on that stroke's page. The `/events` page lists every event with its videos.

## Editing events and records (admin)

While signed in, **Edit** links appear on the site:

- `/events` - "Edit event" on each event card, and "Edit" on each swim row
- stroke pages - an "Edit" column in the records table

They open `/admin/events/{id}` and `/admin/records/{id}`. Visitors who aren't signed in see no links, and those pages redirect them to the sign-in page. Editing a record lets you change the event, stroke, distance, course, time, round, place, date, PB flag and notes. Videos aren't changed there; add more with **Add videos to an event**.

Security: the browser never talks to the write API. Sign-in sets a signed, httpOnly cookie (12 hours); the Next.js server then calls the PHP API with `API_WRITE_KEY`, and the API rejects any POST without it.

## Upgrading an existing database

A fresh database (`docker compose down -v`, then `up --build`) already has everything. To keep existing data, run the migrations you haven't run yet, each **once**, after taking a backup:

```powershell
docker compose cp db/migrations/002_video_event.sql db:/tmp/m.sql
docker compose exec db sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD < /tmp/m.sql'
```

- `001_add_events.sql` - events table and extra record fields (only if you started before events existed)
- `002_video_event.sql` - lets a video belong to an event (so an event can have many videos)

## API (PHP, `api/`)

| Endpoint | Description |
| --- | --- |
| `GET /api/health` | Checks the database connection |
| `GET /api/strokes` | List of strokes |
| `GET /api/events` | Events, newest first, with record counts |
| `GET /api/records` | All records (`?stroke=freestyle` to filter) |
| `GET /api/videos` | All videos, with `eventId` (`?stroke=freestyle` to filter) |
| `POST /api/events` | Create an event (needs `X-API-Key`) |
| `POST /api/records` | Create a record; optional `videos: [{youtubeId, title?}]` (needs `X-API-Key`) |
| `POST /api/videos` | Add videos to an event: `{eventId, videos: [{youtubeId, title?, strokeSlug?}]}` (needs `X-API-Key`) |
| `PUT /api/events/{id}` | Replace an event's fields (needs `X-API-Key`); 404 if it doesn't exist |
| `PUT /api/records/{id}` | Replace a record's swim fields, same body as POST without videos (needs `X-API-Key`); 404 if it doesn't exist |

Validation errors return HTTP 422 with `{"error": "...", "fields": {"field": "message"}}`; video errors use keys like `videos.2.youtubeId`. Code: `api/index.php` (router), `api/lib/handlers.php`, `api/lib/validate.php`, `api/lib/db.php`.

## Backup

```powershell
docker compose exec db sh -c 'mysqldump -uroot -p$MYSQL_ROOT_PASSWORD anora_swim > /tmp/backup.sql'
docker compose cp db:/tmp/backup.sql ./backup.sql
```

`docker compose down -v` deletes the database volume; plain `down`/`stop` keeps it.

## Not included yet

Deleting records, events and videos, editing or removing a video once added (do these in MySQL for now), and multiple admin accounts.


# Run the app
```powershell
docker compose up -d --build web
```

# Run the API
```powershell
docker compose up -d --build api
```