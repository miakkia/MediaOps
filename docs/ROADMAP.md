# MediaOps Roadmap

MediaOps is being built first as a reliable **self-hosted, single-tenant Discord/media automation platform**, with room to grow into a provider-agnostic product and later an optional hosted multi-tenant service.

## Current v1 foundation

- operator-owned Discord application/bot per deployment;
- guild-scoped slash-command registration;
- Emby integration for health, movie search, TV search, latest additions, exact item lookup, and library-wide random movie selection;
- `MediaProvider` abstraction with Emby as the first provider adapter;
- Ombi request-provider integration;
- optional Ombi Discord Router / Forum lifecycle;
- Watch Party scheduling, RSVP, reminder, automatic opening, organizer cancellation, cleanup, and persistent lifecycle state;
- EN/FR interaction foundation;
- public setup/help panels;
- multi-stage Docker image with non-root runtime;
- GHCR publication;
- persistent `/data` appdata model;
- Docker/Portainer/Unraid deployment paths;
- runtime command deployment from the published container;
- secret-based configuration kept outside the repository.

## v1 deployment boundary

The first public release intentionally uses one MediaOps instance for one operator/guild/backend configuration. Emby/Ombi/Watch Party credentials are global to the container.

The public MediaOps Community bot is a restricted demo bot, not a universal bot that other operators should invite. Public v1 users create their own Discord application and bot using `DISCORD_BOT_SETUP.md`.

## Near-term post-v1 priorities

### Multi-tenant / official universal bot architecture

A future official MediaOps bot that can be invited into many unrelated Discord servers is a major architecture project, not a v1 configuration switch.

Requirements include:

- per-guild MediaOps configuration;
- strict tenant isolation;
- encrypted secret storage;
- guild onboarding and administrator authorization;
- per-guild locale/timezone/provider selection;
- per-guild persistent request/Watch Party state;
- safe lifecycle cleanup scoped to the correct guild;
- rate limiting and abuse controls;
- revocation/offboarding;
- a secure way for the hosted bot/service to reach each operator's private Emby/Ombi/Watch Party services without exposing or accidentally sharing another tenant's backend.

Possible future patterns include a central hosted bot/control plane plus a local MediaOps agent running beside the operator's media services. This must be designed explicitly before any universal bot is offered publicly.

### Internationalization

- continue moving user-facing text into the i18n layer;
- support per-server language configuration when multi-guild configuration exists;
- expand localized slash-command descriptions/options.

### Reliability and testing

- expand automated provider/lifecycle tests;
- improve structured logging and operational diagnostics;
- keep dependency auditing and secret/configuration review in CI/release processes;
- continue clean-install/update/persistence acceptance testing.

### Additional providers

Current provider:

1. **Emby** — implemented reference provider

Planned:

2. **Jellyfin**
3. **Plex**

Additional request-provider adapters may follow the same provider-boundary model.

## Public self-hosted release

The first public release should prove:

- a new user can create their own Discord application/bot from documentation;
- the bot can be safely restricted to the intended guild;
- the published container can register its commands without development tooling;
- Emby/Ombi/Watch Party integration works from public configuration examples;
- optional Ombi Discord Router installation works independently;
- persistent state survives container recreation/update;
- secrets remain outside source control and screenshots/support content.

## Unraid Community Apps

MediaOps has a working Unraid deployment path, templates, profile metadata, icon, and public GHCR images. Community Apps remains a distribution step after the clean public-release acceptance pass.

Remaining path:

1. keep GHCR images and templates aligned with stable tags;
2. validate clean install/restart/Force Update/appdata persistence;
3. verify Discord bot creation/setup documentation from a clean operator perspective;
4. keep credentials masked where supported;
5. maintain the no-media-mount, no-privileged, no-Docker-socket security posture;
6. run Community Apps Validate and Scan;
7. resolve all reported issues before submission.

## Watch Party provider architecture

Media library support and synchronized Watch Party support remain related but separate capabilities.

Future architecture direction:

```text
Media Provider
├── Emby
├── Jellyfin
└── Plex

Watch Party Provider
├── current Emby Watch Party integration
├── Jellyfin-compatible synchronized playback
└── Plex-compatible synchronized playback
```

Provider-specific complexity should remain behind adapters while Discord UX stays simple.

## Hosted / commercial option

A future optional hosted edition may provide:

- an official universal MediaOps Discord bot;
- multi-tenant guild configuration;
- local-agent/private-backend connectivity;
- hosted updates/monitoring;
- managed backups;
- simplified onboarding;
- subscription/billing support.

A hosted edition must keep strict tenant isolation and encrypted secret storage. It must never route one guild to another guild/operator's media backend.

## Design principles

- Simplicity first for normal users.
- Provider-specific complexity stays behind adapters.
- No secrets committed to Git.
- Self-hosted remains a first-class deployment model.
- V1 users own their Discord bot identity and provider credentials.
- A universal bot is not released until multi-tenant isolation is intentionally implemented and reviewed.
- Deployment hosts consume prebuilt images rather than source repositories.
- Unraid Community Apps distributes a proven container rather than defining application architecture.
- New abstractions are introduced when they solve a real integration or security need.
