# MediaOps Roadmap

MediaOps is being built first as a reliable self-hosted Discord/media automation platform, with room to grow into a provider-agnostic product and, later, an optional hosted service.

## Current foundation

- Discord bot with automatic slash-command loading
- Emby integration for health, movie search, TV search, latest additions, exact item lookup, and library-wide random movie selection
- Implemented `MediaProvider` abstraction with Emby as the first provider adapter
- Runtime provider selection through `MEDIA_PROVIDER=emby`
- Watch Party scheduling with persistent runtime storage
- RSVP support with Going / Not Going states
- Organizer-only cancellation
- Random movie flow with reroll, exact selection, and scheduling modal
- Bilingual EN/FR interaction foundation
- Public bilingual `/watchparty-setup` panel for simple self-service use
- Production TypeScript build targeting `dist/`
- Multi-stage Docker image with non-root runtime
- Automated GHCR image publication
- Validated Docker deployment on Unraid without copying the source repository to the server
- Persistent `/data` appdata model
- Preconfigured Unraid Docker template
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

- Add automated tests for i18n, provider parsing/matching, Watch Party storage, RSVP, cancellation, custom IDs, and modal validation
- Add CI checks for TypeScript, tests, dependency auditing, and secret scanning
- Improve structured error handling and logging
- Add a meaningful container health strategy appropriate for a Discord bot without a current inbound HTTP service

### Public self-hosted release

Completed foundation:

- production Dockerfile and build configuration
- non-root runtime
- persistent `/data` volume
- GHCR development image
- `.env.example`
- Docker deployment documentation
- Unraid deployment documentation
- preconfigured Unraid v2 template
- validated Unraid runtime using Emby

Still required before the first stable release:

- stable image/tagging policy (`latest` plus version tags)
- broader fresh-install/update/persistence testing
- automated tests and stronger CI gates
- detailed Discord Developer Portal setup guide
- final security/token-rotation documentation review
- release notes and first tagged public release

### Unraid Community Apps distribution

MediaOps now has a working Unraid deployment path and a preconfigured Docker template. Community Apps remains a later distribution step after the container has completed broader validation.

Remaining path:

1. keep the GHCR image and template aligned with stable release tags;
2. validate clean install, restart, Force Update, configuration changes and appdata persistence;
3. finalize icon/profile metadata for a dedicated Community Apps submission repository if required by the current submission process;
4. expose only configuration required by the selected provider;
5. keep Discord and provider credentials masked in the template where supported;
6. maintain the no-media-mount, no-privileged, no-Docker-socket security posture;
7. run Community Apps Validate and Scan using the current official submission flow;
8. submit after the first stable container release is considered supportable.

The first Community Apps release may be **MediaOps for Emby**. Jellyfin and Plex support do not block the initial Unraid release because the provider boundary already exists.

## Multi-provider media architecture

The core `MediaProvider` abstraction is now implemented. Discord commands and shared Watch Party scheduling use normalized provider operations rather than importing the Emby service directly.

Current provider:

1. **Emby** — implemented reference provider

Planned providers:

2. **Jellyfin** — first additional provider candidate
3. **Plex** — dedicated future adapter for Plex-specific metadata/authentication behavior

The current provider contract covers capabilities such as:

- system/server health
- movie search
- TV/series search
- latest additions
- random movie selection
- exact movie lookup by provider ID
- normalized media metadata including display title, original title, sort title, year, overview and media type

Current configuration:

```env
MEDIA_PROVIDER=emby
```

Future values may include `jellyfin` and `plex` once those adapters exist and are validated.

## Watch Party provider architecture

Media library support and synchronized Watch Party support remain related but separate capabilities.

Future architecture direction:

```text
Media Provider
├── Emby
├── Jellyfin
└── Plex

Watch Party Provider
├── current Watch Party service integration
├── Jellyfin-compatible synchronized playback solution
└── Plex Watch Together integration
```

Before implementing additional Watch Party adapters, MediaOps should verify the current official/provider APIs and supported automation capabilities rather than designing around assumptions.

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
- Deployment hosts should consume prebuilt images rather than source repositories
- Unraid Community Apps should distribute a proven container rather than define application architecture
- Public Discord UX should remain understandable without requiring users to memorize slash commands
- New abstractions should be introduced only when they solve a real integration need
