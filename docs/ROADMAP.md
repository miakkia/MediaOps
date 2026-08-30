# MediaOps Roadmap

MediaOps is being built first as a reliable **self-hosted, single-tenant Discord/media automation platform**. The roadmap focuses on making that model stable, secure, easy to deploy, and provider-agnostic over time.

## Current v1 foundation

- operator-owned Discord application/bot per deployment;
- guild-scoped slash-command registration;
- Emby integration for health, movie search, TV search, latest additions, exact item lookup, and library-wide random movie selection;
- compact **Rich Media Cards** across `/movie`, `/tv`, `/latest`, and `/request`;
- poster + title + year for movie discovery;
- poster + title + year + lifecycle status for TV when available;
- server-side authenticated Emby poster retrieval so provider API credentials are not exposed in Discord image URLs;
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

## Rich Media Cards — shipped

Rich Media Cards are now part of the normal MediaOps media-discovery experience instead of a future roadmap item.

Current behavior is intentionally compact:

- `/movie` — up to five visual results with poster, title, and year;
- `/tv` — up to five visual results with poster, title, year, and Continuing/Ended lifecycle status when available;
- `/latest` — recently added media using the same card language;
- `/request` — visual Ombi search results while preserving request state and actions.

The v1 card intentionally avoids runtime, codec, bitrate, language, subtitle, and similar technical metadata. Richer details can be added later only where they improve the normal user flow without making Discord search results noisy.

![MediaOps Rich Media Cards](../Images/Rich%20cards.jpg)

## Near-term post-v1 priorities

### Additional request providers

MediaOps should remain request-provider agnostic. Ombi is the current provider; Seerr is a planned provider option so deployments can choose the request system that fits their environment.

### Discord Account Linking v1

A future account-linking flow can associate a Discord identity with a supported media/request-provider identity for commands such as `/link`, `/unlink`, and `/account`.

This feature requires a dedicated threat model and security design before implementation. Credentials must not be exposed in Discord, logged, or retained unnecessarily.

### Internationalization

- continue moving user-facing text into the i18n layer;
- support per-server language configuration when multi-guild configuration exists;
- expand localized slash-command descriptions/options.

### Reliability and testing

- expand automated provider/lifecycle tests;
- improve structured logging and operational diagnostics;
- keep dependency auditing and secret/configuration review in CI/release processes;
- continue clean-install/update/persistence acceptance testing.

### Additional media providers

Current provider:

1. **Emby** — implemented reference provider

Planned:

2. **Jellyfin** — media discovery plus native SyncPlay integration through Discord
3. **Plex**

Provider-specific complexity should remain behind adapters so the Discord UX, including Rich Media Cards, stays consistent.

### Jellyfin + SyncPlay

Jellyfin support should include both the normal `MediaProvider` capabilities and a Jellyfin-specific synchronized Watch Party adapter based on **Jellyfin SyncPlay**.

The intended Discord experience should remain consistent with the existing Watch Party UX while the backend implementation changes according to the configured provider. Planned Jellyfin/SyncPlay capabilities include:

- Discord commands/actions to create or prepare a Jellyfin SyncPlay session/group;
- Discord join actions that guide authorized participants into the correct Jellyfin SyncPlay session;
- integration with MediaOps Watch Party scheduling, RSVP, reminders, `Start Now`, active-session controls, and Discord cleanup;
- random-movie and scheduled-movie flows using the configured Jellyfin library;
- provider-specific SyncPlay state kept behind a Watch Party adapter rather than leaking Jellyfin implementation details into generic Discord commands;
- security review of Jellyfin authentication/session requirements before implementation, with least-privilege credentials and no credentials, access tokens, or sensitive session material exposed in Discord or logs.

MediaOps should orchestrate Jellyfin SyncPlay rather than implementing its own synchronized playback engine. Third-party Jellyfin Watch Party projects may be evaluated later, but adding another service/container is not the default when native SyncPlay can satisfy the requirement securely and reliably.

## Multi-tenant / official universal bot architecture

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

## Public self-hosted release

The first public release should continue proving that:

- a new user can create their own Discord application/bot from documentation;
- the bot can be safely restricted to the intended guild;
- the published container can register its commands without development tooling;
- Emby/Ombi/Watch Party integration works from public configuration examples;
- optional Ombi Discord Router installation works independently;
- persistent state survives container recreation/update;
- secrets remain outside source control and screenshots/support content.

## Unraid Community Apps

MediaOps is available through the Unraid Community Apps distribution path. The project should keep the published templates, GHCR images, documentation, and application metadata aligned with stable releases.

Ongoing requirements include:

1. keep GHCR images and templates aligned with stable tags;
2. validate clean install/restart/Force Update/appdata persistence after material deployment changes;
3. keep Discord bot creation/setup documentation current;
4. keep credentials masked where supported;
5. maintain the no-media-mount, no-privileged, no-Docker-socket security posture;
6. run Community Apps Validate and Scan when template changes require it.

## Watch Party provider architecture

Media library support and synchronized Watch Party support remain related but separate capabilities.

Current v1 synchronized playback is provided through the open-source [Oratorian/emby-watchparty](https://github.com/Oratorian/emby-watchparty) integration, while MediaOps handles the Discord-side scheduling and lifecycle orchestration.

Future architecture direction:

```text
Media Provider
├── Emby
├── Jellyfin
└── Plex

Watch Party Provider
├── Emby -> current Emby Watch Party integration
├── Jellyfin -> native Jellyfin SyncPlay adapter + Discord commands/actions
└── Plex -> compatible synchronized playback to be evaluated
```

Provider-specific complexity should remain behind adapters while Discord UX stays simple. MediaOps should orchestrate the configured provider's synchronized-playback capability instead of reimplementing media synchronization itself.

## Future / Maybe — hosted multi-tenant MediaOps

A centrally hosted official MediaOps bot is an **idea to revisit later**, not a committed roadmap item, release target, or promised product.

If the project eventually explores this model, it would require a dedicated architecture and security design rather than extending the v1 global configuration directly. Possible capabilities could include:

- one official Discord bot serving multiple unrelated guilds;
- per-guild/tenant MediaOps configuration;
- strict tenant isolation and authorization;
- encrypted secret handling and credential rotation;
- per-guild locale/timezone/provider selection;
- isolated request and Watch Party state;
- rate limiting, abuse controls, revocation, and offboarding;
- secure connectivity to private Emby/Ombi/Watch Party services, potentially through a local outbound MediaOps agent;
- commercial cloud/VPS hosting instead of depending on a personal homelab's power, Internet, or hardware;
- an optional paid/VIP managed tier to offset hosted infrastructure, monitoring, backup, and maintenance costs while keeping the self-hosted edition free.

Before any implementation, this concept would require a dedicated cybersecurity review covering tenant isolation, secret storage, SSRF/backend reachability, compromise blast radius, authentication between cloud and local agents, logging/privacy boundaries, backups, incident response, and operational availability.

**Status: Future / Maybe. No commitment and no target release.**

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
