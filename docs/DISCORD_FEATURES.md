# Discord Features

MediaOps uses Discord as the primary user interface for media discovery, request submission, Watch Party coordination, and lightweight server operations.

## Design goal

Normal users should not need to memorize a large command set. Slash commands remain available for direct access, while persistent setup panels, buttons, confirmations, and modals provide guided paths for common tasks.

## Current commands

MediaOps currently registers 15 guild-scoped Discord commands.

### User-facing media commands

- `/movie` — search for movies in the connected media library.
- `/tv` — search for TV series.
- `/latest` — show recently added movies and series.
- `/request` — search the configured request provider, currently Ombi, and submit a movie or TV request.

### Watch Party

- `/watchparty` — open the configured Watch Party service.
- `/watchparty-start` — validate an existing Watch Party code and provide a join action.
- `/watchparty-status` — verify whether a Watch Party is still active.
- `/watchparty-schedule` — schedule a Watch Party for a specific movie.
- `/watchpartyrandom` — select a random movie from the library, reroll, choose the result, and schedule it.
- `/watchparty-upcoming` — show upcoming and active scheduled Watch Parties.
- `/watchparty-setup` — administrator command that publishes the bilingual Watch Party self-service panel.

### Setup and diagnostics

- `/mediaops-setup` — administrator command that publishes the user-facing MediaOps command guide.
- `/mediaops-admin-setup` — administrator command that publishes the diagnostics guide.
- `/ping` — administrator diagnostic confirming that the bot is online.
- `/health` — administrator diagnostic showing MediaOps build information plus Emby and request-provider connectivity.

`/ping`, `/health`, `/mediaops-setup`, `/mediaops-admin-setup`, and `/watchparty-setup` require the Discord **Manage Server** permission by default. Diagnostic replies are ephemeral.

## Request flow

The request workflow is button-driven and keeps provider details out of the normal user experience.

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

Request selections use short-lived, user-bound tokens. This prevents another Discord user from taking over someone else's selection and avoids exposing raw provider identifiers as the normal interaction state.

When a Discord user has a matching Ombi Discord notification preference, MediaOps maps the request to that Ombi account so Ombi records the real requester rather than the generic API identity.

`OMBI_AUTO_APPROVE=false` leaves the request pending for Ombi administration. `OMBI_AUTO_APPROVE=true` requests automatic approval after creation. Request attribution is preserved in both modes.

Successful requests are persisted under the MediaOps data directory and periodically checked for availability. When the requested title becomes available, MediaOps sends the requester a one-time Discord DM.

## Optional Media Request Forum

MediaOps can maintain a Discord Forum as a searchable request history when the companion Ombi Discord Router is configured.

Each media item keeps one Forum post. The media-type tag stays attached while the status tag moves through the supported lifecycle:

```text
Movie / Series + Requested
        -> Processing
        -> Available / Failed / Denied
```

Completed states are terminal. MediaOps locks completed posts and removes them from the active Forum view without deleting their history.

Forum synchronization is optional and configuration-driven. It does not replace `/request`, and normal Discord messages are not treated as request-state commands.

See [`REQUEST_FORUM.md`](REQUEST_FORUM.md) for setup, required tags, permissions, and security behavior.

## MediaOps setup panel

`/mediaops-setup` publishes a persistent user-facing guide so members can discover the normal media and Watch Party commands without relying on Discord slash-command autocomplete alone. It highlights media search, requests, recently added content, upcoming Watch Parties, and Watch Party status.

The administrator-oriented `/mediaops-admin-setup` panel provides the recommended `/ping` -> `/health` -> container-log troubleshooting path without exposing diagnostics to normal members.

## Public Watch Party panel

`/watchparty-setup` publishes a bilingual self-service panel. It exposes three primary actions:

- **Random / Aléatoire** — choose a random movie from the library.
- **Planifier / Schedule** — open a modal to select a movie, date, and time.
- **Ouvrir / Open** — open the Watch Party web application.

The panel also points members to `/watchparty-upcoming` and `/watchparty-status` so the persistent setup message acts as the entry point for the complete normal Watch Party workflow.

## Random movie flow

The random picker selects from the full movie library rather than a fixed first-page sample.

```text
/watchpartyrandom
    -> Random movie
    -> Another movie (optional)
    -> Choose this movie
    -> Date + Time modal
    -> Scheduled Watch Party announcement
```

The selected media item is carried forward using its provider item ID, avoiding a second title search after the user has already chosen the movie.

## Manual scheduling flow

The scheduling flow asks for:

- Movie title
- Date (`YYYY-MM-DD`)
- Time (`HH:MM`)

MediaOps attempts to resolve the intended movie using normalized provider metadata, currently including display title, original title, and sort title where available.

Once resolved, MediaOps publishes a public scheduled Watch Party message containing the movie identity, organizer, Discord timestamp, relative start time, RSVP controls, and organizer cancellation control.

## RSVP, reminders, opening, and cancellation

Scheduled Watch Parties support:

- Going / attending;
- Not going;
- organizer-only cancellation, including after the room has opened;
- persistent RSVP state;
- one-time reminder approximately 15 minutes before start;
- automatic Watch Party room creation at scheduled start;
- direct `/party/CODE` join links;
- tracked cleanup of Watch Party announcement/reminder/open-room messages when the lifecycle is finished or cancelled.

At the scheduled time, MediaOps creates the Watch Party using the configured dedicated non-admin Emby host account and announces the room code and direct room URL.

## Watch Party lifecycle and expiry

MediaOps keeps Watch Party lifecycle state persistently under `/data`.

Normal lifecycle:

```text
scheduled
    -> ready 30 minutes before start
    -> active when the room is created at start time
    -> expired after the movie runtime plus a 45-minute grace period
```

The movie runtime is read from Emby. If runtime information cannot be read, MediaOps uses a **4.5-hour safety fallback** so a provider lookup problem cannot leave the lifecycle without an expiry limit.

Old terminal Watch Party records are retained for the configured number of days and then removed automatically.

## Upcoming Watch Parties

`/watchparty-upcoming` lists scheduled, ready, and active Watch Parties for the current Discord server. This provides a persistent view even after the original scheduling announcement has moved up in channel history.

## Internationalization

MediaOps currently has an EN/FR i18n foundation.

- user-facing strings should live in the i18n layer when practical;
- public help/setup panels may be bilingual for mixed-language communities;
- technical logs may remain in English;
- new commands should include localized descriptions where Discord supports them.

The default timezone for scheduling input without an explicit offset is configurable through `MEDIAOPS_TIMEZONE` using an IANA timezone such as `America/Toronto`.

## Permissions and trust boundaries

Administrative setup and diagnostic actions require appropriate Discord permissions. Normal media discovery, requests, and Watch Party participation remain usable by regular members unless a future per-guild policy restricts them.

Request selection tokens are bound to the Discord user who created them. Watch Party cancellation validates the organizer against persistent server-side state rather than trusting a button identifier alone.

Optional Forum automation is scoped to the configured Forum and configured integration source. Administrators should grant only the Discord channel permissions and gateway intents required by enabled features.

## Planned after the first public release

Planned work includes configurable Discord roles for scheduling/admin actions, additional media and request-provider adapters, broader localization, richer administration UX, and optional hosted-bot onboarding. Jellyfin and Plex are not part of the first public release.
