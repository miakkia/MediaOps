# First public development release scope

The first public MediaOps release is intentionally a development baseline rather than the completion of every planned integration.

## In scope

### Discord bot

- health/status reporting;
- media lookup commands backed by Emby;
- request workflow backed by Ombi;
- Discord Forum request lifecycle integration;
- Watch Party scheduling and lifecycle commands.

### Requests

- Discord-to-Ombi requester mapping;
- request submission;
- approval/processing/availability Forum lifecycle through the companion router;
- persistent request tracking and lifecycle recovery.

### Watch Party

- scheduling;
- RSVP;
- T-15 reminder;
- automatic room creation at scheduled start;
- organizer cancellation, including after activation;
- tracked Discord announcement cleanup;
- persistent lifecycle state and restart recovery;
- runtime-aware/fallback expiry.

### Deployment

- Docker images published through GHCR;
- companion Ombi router image;
- Docker/Unraid deployment examples;
- persistent data directories and documented configuration.

## Explicitly out of scope for this release

- Jellyfin integration;
- Plex integration;
- additional request providers;
- complete multilingual coverage of every Discord string;
- advanced moderation/administration UI;
- hosted/SaaS operation.

## Release quality bar

The release is ready when the in-scope features can be deployed on a clean host using only repository documentation, the release images pass the documented acceptance test, secrets/configuration have been audited, and the release commit passes typecheck, automated tests and dependency audit.
