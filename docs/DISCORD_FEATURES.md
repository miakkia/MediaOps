# Discord Features

MediaOps uses Discord as the primary user interface for media discovery, request submission, Watch Party coordination, and lightweight server operations.

## Design goal

The Discord experience should remain simple enough that normal users do not need to memorize commands. Slash commands remain available for direct access, while setup panels, buttons, confirmations, and modals provide a guided path for common tasks.

## Current commands

### General

- `/ping` — confirm that the bot is online.
- `/health` — show MediaOps build information plus Emby and request-provider connectivity.

### Media discovery

- `/movie` — search for movies in the connected media library.
- `/tv` — search for TV series.
- `/latest` — show recently added movies and series.

### Requests

- `/request` — search the configured request provider, currently Ombi, and submit a movie or TV request.

### Watch Party

- `/watchparty` — open the configured Watch Party service.
- `/watchparty-start` — validate an existing Watch Party code and provide a join action.
- `/watchparty-status` — verify whether a Watch Party is still active.
- `/watchparty-schedule` — schedule a Watch Party for a specific movie.
- `/watchpartyrandom` — select a random movie from the library, reroll, choose the result, and schedule it.
- `/watchparty-setup` — administrator command that publishes a bilingual Watch Party panel in the current channel.
- `/watchparty-upcoming` — show upcoming and active scheduled Watch Parties.

## Request flow

The request workflow is button-driven and keeps provider details out of the normal user experience.

Typical flow:

```text
/request
    -> Search Ombi
    -> Show up to five results
    -> Choose requestable result
    -> Confirm exact title/year
    -> Create request
    -> Pending or auto-approved according to OMBI_AUTO_APPROVE
    -> Track request persistently
    -> Notify requester when media becomes available
```

Request selections are represented by short-lived, user-bound tokens. This prevents another Discord user from taking over someone else's selection and avoids exposing raw provider identifiers as the normal interaction state.

When a Discord user has a matching Ombi Discord notification preference, MediaOps maps the request to that Ombi account so Ombi records the real requester rather than the generic API identity.

`OMBI_AUTO_APPROVE=false` leaves the request pending for Ombi administration. `OMBI_AUTO_APPROVE=true` requests automatic approval after creation. Request attribution is preserved in both modes.

Successful requests are persisted under the MediaOps data directory and periodically checked for availability. When the requested title becomes available, MediaOps sends the requester a one-time Discord DM.

## Public Watch Party panel

The setup panel is intentionally small and self-service oriented. It exposes three primary actions:

- **Random / Aléatoire** — choose a random movie from the library.
- **Planifier / Schedule** — open a modal to select a movie, date, and time.
- **Ouvrir / Open** — open the Watch Party web application.

The public panel is bilingual so members can understand the available actions without changing Discord locale settings. Private replies and modal interactions can continue to follow the detected interaction locale.

## Random movie flow

The random picker selects from the full movie library rather than a fixed first-page sample.

Typical flow:

```text
/watchpartyrandom
    -> Random movie
    -> Another movie (optional)
    -> Choose this movie
    -> Date + Time modal
    -> Scheduled Watch Party announcement
```

The selected media item is carried forward using its provider item ID, avoiding a second title search when the user has already chosen the movie.

## Manual scheduling flow

The setup panel's scheduling action asks only for:

- Movie title
- Date (`YYYY-MM-DD`)
- Time (`HH:MM`)

MediaOps attempts to resolve the intended movie using normalized provider metadata, currently including display title, original title, and sort title where available.

Once resolved, MediaOps publishes a public scheduled Watch Party message containing:

- movie title and year;
- organizer;
- scheduled Discord timestamp;
- relative start time;
- RSVP controls;
- organizer-only cancellation before the party starts.

## RSVP, reminders, and automatic opening

Scheduled Watch Parties support:

- Going / attending
- Not going
- Organizer-only cancellation before start
- Persistent RSVP state
- One-time reminder shortly before start
- Automatic Watch Party room creation at scheduled start
- Direct `/party/CODE` join links

The public message is updated as participants respond. At the scheduled time, MediaOps creates the Watch Party using the dedicated configured non-admin Emby host account and announces the room code and direct room URL.

## Watch Party lifecycle and expiry

MediaOps keeps Watch Party lifecycle state persistently under `/data`.

Normal lifecycle:

```text
scheduled
    -> ready 30 minutes before start
    -> active when the room is created at start time
    -> expired after the movie runtime plus a 45-minute grace period
```

The movie runtime is read from Emby. If runtime information cannot be read, MediaOps keeps a six-hour fallback expiry so a provider lookup problem cannot leave the lifecycle without a safety limit.

Old terminal Watch Party records are retained for the configured number of days and then removed automatically.

## Upcoming Watch Parties

`/watchparty-upcoming` lists scheduled, ready, and active Watch Parties for the current Discord server. This provides a persistent view even after the original scheduling announcement has moved up in channel history.

## Internationalization

MediaOps currently has an EN/FR i18n foundation.

Guidelines:

- user-facing strings should live in the i18n layer when practical;
- public help/setup panels may be bilingual when that is simpler for mixed-language communities;
- technical logs may remain in English;
- new commands should include localized descriptions where Discord supports them.

The default timezone for scheduling input without an explicit offset is configurable through `MEDIAOPS_TIMEZONE` using an IANA timezone such as `America/Toronto`.

## Permissions and trust boundaries

Administrative setup actions should require appropriate Discord permissions. Normal media discovery, requests, and Watch Party participation should remain usable by regular members unless a future per-guild policy restricts them.

Request selection tokens are bound to the Discord user who created them. Watch Party cancellation validates the organizer against persistent server-side state rather than trusting a button identifier alone.

## Planned Discord features

Likely next additions include:

- controlled Watch Party room dissolution near the end-of-session grace window;
- configurable Discord roles for scheduling/admin actions;
- richer request status transitions beyond final availability;
- additional media and request provider adapters;
- richer status/help panels;
- optional hosted-bot onboarding.

The priority remains the same: keep the normal user flow obvious, short, and button-driven wherever that improves usability.
