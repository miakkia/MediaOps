# Product Scope

MediaOps is a self-hosted platform that connects Discord communities with media servers, Watch Party workflows, request systems, notifications, and media-oriented automation.

## Product goal

MediaOps should make common media-community tasks simple for normal Discord members while giving self-hosted administrators a clean, secure integration layer behind the scenes.

## V1 deployment model

The first public release is **self-hosted and single-tenant**.

Each administrator owns:

- their Discord application/bot;
- their MediaOps container;
- their Emby/Ombi/Watch Party credentials;
- their persistent MediaOps data.

One v1 MediaOps container uses one global provider configuration. It is not a universal multi-tenant bot for unrelated Discord guilds.

The MediaOps Community bot is a project/demo bot only. Public operators create their own bot using `DISCORD_BOT_SETUP.md`.

## Primary users

### Community member

A normal Discord member should be able to:

- search for movies/TV series;
- view latest additions;
- submit media requests;
- get a random movie suggestion;
- schedule/join a Watch Party;
- RSVP to scheduled events;
- use buttons/modals/help panels instead of memorizing commands.

### Server administrator

A Discord/media administrator should be able to:

- create and secure their own Discord bot;
- connect MediaOps to their media server/request provider/Watch Party service;
- publish user/admin setup panels;
- control privileged setup actions;
- deploy updates without losing persistent state;
- keep credentials outside source control.

## Current functional scope

- Discord runtime and 15 guild-scoped commands;
- health/build/provider diagnostics;
- Emby movie search, TV search, latest additions, exact lookup, and random movie selection;
- Ombi request search/submission, requester attribution, optional auto-approval, persistent tracking, and availability notification;
- optional Discord Forum request lifecycle through the companion Ombi Discord Router;
- Watch Party scheduling, RSVP, T-15 reminder, automatic opening, direct join links, organizer cancellation after activation, cleanup, and persistent lifecycle state;
- EN/FR foundations and bilingual public Watch Party guidance;
- self-service/admin setup panels;
- Docker/GHCR/Portainer/Unraid deployment.

## Multi-provider scope

Emby is the current/reference media provider. Jellyfin and Plex are future provider candidates. Provider-specific API behavior should remain behind adapters while Discord UX stays consistent.

## Request-system scope

Ombi is the current/reference request provider. The request-provider boundary is designed so additional providers can be added without rewriting normal Discord workflows.

## Deployment scope

### Self-hosted v1

Expected characteristics:

- operator-owned Discord application/bot;
- operator-owned media infrastructure and credentials;
- one provider configuration per MediaOps instance;
- local persistent MediaOps state;
- Docker as the preferred public target;
- Portainer/Compose and Unraid deployment support;
- optional independently deployed Ombi Discord Router.

### Future / Maybe hosted multi-tenant model

A hosted edition is **not committed or scheduled**. It is retained only as a future concept that may be evaluated after the self-hosted product is established.

If pursued, it could provide:

- an official universal Discord bot;
- per-guild provider configuration;
- strict tenant isolation;
- encrypted secret handling;
- secure private-backend connectivity, potentially through a local outbound agent;
- managed upgrades/monitoring/backups;
- simplified onboarding;
- optional paid/VIP service to cover commercial hosting and operations costs.

The hosted service would ideally run on dedicated commercial cloud/VPS infrastructure rather than a personal homelab, so customer availability would not depend on the maintainer's residential Internet, electricity, or hardware.

Any such model requires a separate architecture/security review before development. It must never route one guild to another operator's backend, must minimize the secrets held centrally where practical, and must not replace the free self-hosted edition.

## Out of scope for v1

- universal hosted MediaOps bot;
- multi-tenant per-guild backend configuration;
- hosted SaaS/VIP service;
- Jellyfin/Plex support;
- replacing/transcoding/streaming through MediaOps itself;
- directly scanning media filesystem mounts;
- custom media player;
- centralized cloud requirement for self-hosted users.

## Product constraints

MediaOps should favor simple workflows, minimal privileges, provider APIs instead of direct filesystem access, persistent state across upgrades, strict secret separation, and gradual architecture evolution.

## Success criteria

V1 succeeds when a new operator can create their own Discord bot, deploy MediaOps from public images/documentation, connect their own Emby/Ombi/Watch Party services, and let normal Discord users complete common media tasks safely without sharing that deployment's backend with unrelated guilds.
