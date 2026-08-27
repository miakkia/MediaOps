# First public development release scope

The first public MediaOps release is intentionally a self-hosted development baseline rather than a universal hosted Discord service.

## Deployment model for v1

MediaOps v1 is **self-hosted and single-tenant**:

- each operator creates/owns a Discord application and bot;
- each operator runs their own MediaOps container;
- each deployment uses that operator's Emby, Ombi, and Watch Party configuration;
- provider credentials are global to that MediaOps container, not isolated per Discord guild;
- the public MediaOps Community demo bot is for the project/community demo only and is not the universal bot for other operators.

Operators should not invite one v1 bot instance into unrelated guilds that require different backend credentials. See `DISCORD_BOT_SETUP.md`.

## In scope

### Discord bot

- operator-owned Discord application/bot setup;
- guild-scoped command deployment;
- health/status reporting;
- media lookup commands backed by Emby;
- request workflow backed by Ombi;
- Discord Forum request lifecycle integration;
- Watch Party scheduling and lifecycle commands;
- persistent user/admin setup panels.

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
- Docker/Portainer/Unraid deployment examples;
- operator-owned Discord bot setup guide;
- persistent data directories and documented configuration.

## Explicitly out of scope for this release

- universal/official multi-guild SaaS bot operation;
- per-guild Emby/Ombi/Watch Party credential isolation in one central MediaOps instance;
- hosted onboarding/control plane;
- Jellyfin integration;
- Plex integration;
- additional request providers;
- complete multilingual coverage of every Discord string;
- advanced moderation/administration UI.

## Future multi-tenant requirement

A future official universal MediaOps bot must not reuse one operator's backend configuration for other guilds. Multi-tenant support requires at minimum per-guild configuration, strict tenant isolation, secure/encrypted secret storage, and a safe connectivity model for user-owned private media services.

## Release quality bar

The release is ready when the self-hosted single-tenant workflow can be deployed on a clean host using only repository documentation, the release images pass the documented acceptance test, Discord bot creation is reproducible, secrets/configuration have been audited, and the release commit passes typecheck, automated tests and dependency audit.
