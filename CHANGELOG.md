# Changelog

All notable changes to MediaOps are documented here.

## [Unreleased]

### Added

- **Jellyfin media provider** selectable with `MEDIA_PROVIDER=jellyfin`.
- Jellyfin system information, movie/series search, latest additions, random movie selection, exact movie lookup, posters, and event artwork retrieval.
- **Seerr request provider** selectable with `REQUEST_PROVIDER=seerr`.
- Seerr health checks, search, movie requests, TV/series requests, request IDs, and request-status mapping.
- Provider-aware `/health` diagnostics for the selected media and request providers.
- MediaOps Discord Router `/seerr` webhook adapter alongside the existing `/ombi` route.
- Discord Router provider-aware test messages, request labels, requester mapping, persistent same-thread lifecycle updates, and dynamic Forum tag updates.
- Additional automated coverage for Jellyfin, Seerr, provider selection, provider security behavior, artwork retrieval, and request status handling.

### Changed

- Provider configuration is now lazy/provider-specific: unselected providers do not require their URL/API-key variables.
- Ombi and Seerr approval behavior is owned by each provider's configured user/role policy; MediaOps does not force approval.
- `OMBI_AUTO_APPROVE` has been removed from current configuration.
- Request responses and health output are provider-aware rather than hard-coded to Ombi/Emby.
- The historical Ombi Discord Router is being generalized as **MediaOps Discord Router** while retaining the existing GHCR image/path for upgrade compatibility.
- Router state handling uses one Gunicorn process with threaded concurrency to avoid cross-process races on its small file-backed thread index.
- A new request ID for the same provider media ID starts a fresh Discord Forum request lifecycle instead of being blocked by an older terminal state.

### Security

- Jellyfin and Seerr credentials are scoped to the selected provider and are not required when that provider is not selected.
- Jellyfin/Seerr clients use authenticated request headers and defensive response validation.
- Redirect behavior is restricted to avoid unsafe credential forwarding.
- Router remains non-root/read-only except for explicit persistent `/data`, with `cap_drop=ALL` and `no-new-privileges` in hardened examples.
- Discord bot token used for Forum tag mutation is runtime-only and must not be committed or logged.

### Tested

- Real Jellyfin + Seerr integration was exercised on a private Docker/Portainer lab.
- Jellyfin `/health` and real movie/poster lookup were verified.
- Seerr request creation and provider health were verified.
- Seerr generic webhook → MediaOps Discord Router → Discord Forum was verified end-to-end.
- Router requester attribution, same-thread `Processing` → `Available` updates, poster metadata, and Forum tag transition were verified in Discord.
- Router persistent-state permission failure was reproduced and resolved with a writable pre-created bind directory while retaining non-root/read-only hardening.

### Known scope

- Jellyfin SyncPlay orchestration is not included yet.
- Plex is not included yet.
- The Emby Watch Party integration remains the current Watch Party implementation.
- Existing Emby + Ombi deployments remain supported; migration to Jellyfin/Seerr is optional.

## [1.0.0] - 2026-08-30

First stable public self-hosted MediaOps baseline.

### Highlights

- Discord Rich Media Cards for `/movie`, `/tv`, `/latest`, and `/request`.
- Emby media provider and Ombi request provider.
- Persistent request tracking and Discord availability notifications.
- Optional Discord Forum request history through the companion router.
- Watch Party scheduling, RSVP, reminders, automatic room creation, random movie selection, lifecycle cleanup, and organizer controls.
- EN/FR foundation, Docker/GHCR distribution, Unraid templates, and security-first non-root runtime.

## Development history

Git history and pull requests remain the source of truth for individual implementation commits and reviews.
