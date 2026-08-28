# MediaOps v1.0.0 release scope

The first public MediaOps release is intentionally a self-hosted baseline rather than a universal hosted Discord service.

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
- 15 guild-scoped commands;
- health/status reporting;
- media lookup commands backed by Emby;
- request workflow backed by Ombi;
- optional Discord Forum request lifecycle integration;
- Watch Party scheduling and lifecycle commands;
- persistent user/admin setup panels.

### Requests

- Discord-to-Ombi requester mapping;
- request submission with configurable auto-approval;
- approval/processing/availability Forum lifecycle through the optional companion router;
- persistent request tracking and one-time requester availability notification.

### Watch Party

- integration with the external open-source [Oratorian/emby-watchparty](https://github.com/Oratorian/emby-watchparty) service;
- scheduling interpreted in `MEDIAOPS_TIMEZONE`;
- RSVP and initial `@here` announcement support;
- T-15 reminder;
- automatic room creation at scheduled start;
- direct room join links;
- organizer cancellation, including after activation;
- tracked Discord announcement/reminder/open-room cleanup;
- persistent lifecycle state and restart recovery;
- runtime-aware/fallback expiry.

### Deployment

- Docker images published through GHCR;
- companion Ombi router image;
- Docker/Portainer/Unraid deployment examples;
- operator-owned Discord bot setup guide;
- persistent data directories and documented configuration;
- runtime slash-command registration from the published MediaOps container.

## Explicitly out of scope for this release

- universal/official multi-guild SaaS bot operation;
- per-guild Emby/Ombi/Watch Party credential isolation in one central MediaOps instance;
- hosted onboarding/control plane;
- Jellyfin integration;
- Plex integration;
- additional request providers;
- rich interactive `/movie`/`/tv` detail cards and actions beyond the current matching-result search;
- complete multilingual coverage of every Discord string;
- advanced moderation/administration UI.

## Future multi-tenant requirement

A future official universal MediaOps bot must not reuse one operator's backend configuration for other guilds. Multi-tenant support requires at minimum per-guild configuration, strict tenant isolation, secure/encrypted secret storage, and a safe connectivity model for user-owned private media services.

## Release quality bar

The implementation quality gate has been demonstrated through clean-host deployment, published-image validation, typecheck, automated tests, dependency audit, application/container builds, and live workflow testing. Final v1.0.0 publication still requires the public-repository/privacy/distribution checks tracked in `RELEASE_READINESS.md`.
