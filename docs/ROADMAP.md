# MediaOps Roadmap

MediaOps is being built first as a reliable self-hosted Discord/media automation platform, with room to grow into a provider-agnostic product and, later, an optional hosted service.

## Current foundation

- Discord bot with automatic slash-command loading
- Emby integration for health, movie search, TV search, latest additions, exact item lookup, and library-wide random movie selection
- Watch Party scheduling with persistent runtime storage
- RSVP support with Going / Not Going states
- Organizer-only cancellation
- Random movie flow with reroll, exact selection, and scheduling modal
- Bilingual EN/FR interaction foundation
- Public bilingual `/watchparty-setup` panel for simple self-service use
- Runtime data excluded from Git
- Secret-based configuration kept outside the repository

## Near-term priorities

### Watch Party lifecycle

- List upcoming scheduled Watch Parties
- Add lifecycle handling for scheduled, ready, active, expired, cancelled, and auto-cancelled states
- Improve timezone handling with configurable server/guild timezone instead of relying on host-local time
- Refine public Watch Party panel and scheduling UX while keeping the interface simple
- Add automated cleanup/expiry handling without deleting useful history

### Internationalization

- Finish moving all user-facing text into the i18n layer
- Support per-server language configuration
- Keep public setup/help panels bilingual where that provides the simplest experience
- Expand localized slash-command descriptions and options where appropriate

### Reliability and testing

- Add automated tests for i18n, Emby parsing, provider matching, Watch Party storage, RSVP, cancellation, custom IDs, and modal validation
- Add CI checks for TypeScript, tests, dependency auditing, and secret scanning
- Improve structured error handling and logging

### Public self-hosted release

- Dockerfile and production container configuration
- Non-root runtime where practical
- Persistent `/data` volume
- Healthcheck, memory/PID limits, and `no-new-privileges`
- Complete `.env.example`
- Detailed Discord Developer Portal setup guide so every self-hosted installation can use its own bot
- Installation and upgrade documentation
- Security documentation and token-rotation guidance
- First tagged public release

## Multi-provider media architecture

MediaOps should not remain permanently tied to Emby. The long-term architecture should introduce a common `MediaProvider` abstraction so Discord commands and Watch Party workflows do not need to know which media server is behind them.

Target media providers:

1. **Emby** — reference implementation and current provider
2. **Jellyfin** — first additional provider candidate because its API/model is close to Emby
3. **Plex** — planned provider with its own adapter for Plex-specific API and metadata behavior

A future provider interface should expose capabilities similar to:

- system/server health
- movie search
- TV/series search
- latest additions
- random movie selection
- exact item lookup by provider ID
- normalized media metadata such as display title, original title, sort title, year, overview, and media type

The Discord layer should eventually call generic methods such as `mediaProvider.searchMovies()` or `mediaProvider.getRandomMovie()` instead of Emby-specific functions.

Example configuration direction:

```env
MEDIA_PROVIDER=emby
```

with future values such as `jellyfin` or `plex`.

## Watch Party provider architecture

Media library support and synchronized Watch Party support should be treated as related but separate capabilities.

Future architecture direction:

```text
Media Provider
├── Emby
├── Jellyfin
└── Plex

Watch Party Provider
├── Emby-compatible Watch Party service
├── Jellyfin-compatible synchronized playback solution
└── Plex Watch Together integration
```

Before implementing these adapters, MediaOps should verify the current official/provider APIs and supported automation capabilities for Jellyfin and Plex instead of designing around assumptions.

The goal is to preserve one simple Discord experience while allowing provider-specific implementations behind it.

## Hosted / commercial option

The self-hosted edition should remain capable of using a user-owned Discord bot and user-owned media infrastructure.

A future optional hosted edition may provide:

- an official universal MediaOps Discord bot
- multi-tenant guild configuration
- hosted updates and monitoring
- managed backups
- simplified onboarding
- subscription/billing support

A hosted edition must keep strict tenant isolation and encrypted secret storage. It should not weaken the self-hosted model or require users to hand over personal bot/media credentials unnecessarily.

## Design principles

- Simplicity first: fewer steps for normal users
- Provider-specific complexity stays behind adapters
- No secrets committed to Git
- Self-hosted remains a first-class deployment model
- Public Discord UX should remain understandable without requiring users to memorize slash commands
- New abstractions should be introduced only when they solve a real integration need
