# Discord Features

MediaOps uses Discord as the primary user interface for media discovery, Watch Party coordination, and lightweight server operations.

## Design goal

The Discord experience should remain simple enough that normal users do not need to memorize commands. Slash commands remain available for direct access, while setup panels, buttons, and modals provide a guided path for common tasks.

## Current commands

### General

- `/ping` — confirm that the bot is online.
- `/health` — check the bot and media server connection.

### Media discovery

- `/movie` — search for movies in the connected media library.
- `/tv` — search for TV series.
- `/latest` — show recently added movies and series.

### Watch Party

- `/watchparty` — open the configured Watch Party service.
- `/watchparty-start` — validate an existing Watch Party code and provide a join action.
- `/watchparty-status` — verify whether a Watch Party is still active.
- `/watchparty-schedule` — schedule a Watch Party for a specific movie.
- `/watchpartyrandom` — select a random movie from the library, reroll, choose the result, and schedule it.
- `/watchparty-setup` — administrator command that publishes a bilingual Watch Party panel in the current channel.

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
- organizer-only cancellation.

## RSVP and cancellation

Scheduled Watch Parties support:

- Going / attending
- Not going
- Organizer-only cancellation

The public message is updated as participants respond. Cancellation changes the scheduled event state and updates the public message without implying that an external Watch Party session was created or cancelled.

## Internationalization

MediaOps currently has an EN/FR i18n foundation.

Guidelines:

- user-facing strings should live in the i18n layer when practical;
- public help/setup panels may be bilingual when that is simpler for mixed-language communities;
- technical logs may remain in English;
- new commands should include localized descriptions where Discord supports them.

## Permissions

Administrative setup actions should require appropriate Discord permissions. Normal media discovery and Watch Party participation should remain usable by regular members unless a future per-guild policy restricts them.

## Future Discord features

Planned or likely additions include:

- upcoming Watch Party listing;
- per-server language and timezone settings;
- configurable roles for scheduling/admin actions;
- provider-independent media commands;
- richer status/help panels;
- request-system integrations;
- optional hosted-bot onboarding.

The priority remains the same: keep the normal user flow obvious, short, and button-driven wherever that improves usability.
