# Product Scope

MediaOps is a self-hosted platform that connects Discord communities with media servers, Watch Party workflows, request systems, notifications, and media-oriented automation.

## Product goal

MediaOps should make common media-community tasks simple enough for normal Discord members while giving self-hosted administrators a clean, secure integration layer behind the scenes.

The product should reduce the need for users to understand media-server APIs, internal URLs, provider metadata, or deployment details.

## Primary users

### Community member

A normal Discord member should be able to:

- search for a movie or TV series;
- view latest additions;
- get a random movie suggestion;
- schedule or join a Watch Party;
- RSVP to a scheduled event;
- interact through buttons and simple modals instead of memorizing commands.

### Server administrator

A Discord/media administrator should be able to:

- connect MediaOps to their media server;
- configure their own Discord bot for self-hosted use;
- publish a simple Watch Party panel;
- control privileged setup actions;
- deploy updates without losing persistent state;
- keep credentials outside the source repository.

### Future hosted customer

A future hosted edition may allow an administrator to use an official MediaOps Discord bot without operating the application themselves. This is a future deployment model, not a requirement for the self-hosted edition.

## Current functional scope

The current Emby-first implementation includes:

- Discord bot runtime and dynamic slash-command loading;
- health checks;
- movie search;
- TV-series search;
- latest additions;
- exact media lookup;
- full-library random movie selection;
- title matching using display, original, and sort titles where available;
- Watch Party service access and session validation;
- Watch Party scheduling;
- persistent scheduled-event storage;
- RSVP tracking;
- organizer-only cancellation;
- random-movie-to-scheduling flow;
- bilingual EN/FR foundations;
- bilingual public Watch Party setup panel.

## Near-term scope

The near-term product should focus on making the existing core reliable and public-ready:

- Watch Party lifecycle management;
- configurable timezone handling;
- upcoming-event listing;
- automated tests;
- CI and security checks;
- Docker distribution;
- GHCR image publishing;
- complete configuration and installation documentation;
- Unraid Community Apps packaging and submission;
- first tagged public release.

## Multi-provider scope

MediaOps is intended to grow beyond Emby.

Planned provider direction:

- Emby as the current/reference provider;
- Jellyfin as a future provider candidate;
- Plex as a future provider candidate.

The Discord UX should remain consistent while provider-specific API behavior is isolated behind adapters.

Media library integration and synchronized Watch Party integration are separate product capabilities. Supporting a provider's library does not automatically imply support for its synchronized playback feature.

## Request-system scope

Request-management integrations are part of the broader MediaOps vision but are not yet the primary development focus.

Potential integrations may include existing request platforms or provider-specific request workflows. They should be added through explicit integration boundaries rather than hard-wired into Discord command logic.

## Deployment scope

### Self-hosted

Self-hosted is the primary current deployment model.

Expected characteristics:

- user-owned Discord application/bot;
- user-owned media server;
- user-owned credentials;
- local persistent MediaOps state;
- Docker as the preferred public deployment target;
- Unraid Community Apps as a planned distribution channel.

### Hosted

A future hosted edition may provide:

- an official universal bot;
- managed upgrades;
- multi-tenant configuration;
- monitoring and backups;
- simplified onboarding;
- subscription/billing support.

This hosted option must preserve strict tenant isolation and must not replace the self-hosted edition.

## Out of scope for the current phase

The following are not current core requirements:

- replacing the media server itself;
- directly scanning media files from Movies/Series mounts;
- transcoding or streaming media through MediaOps;
- storing user media-server passwords;
- building a custom media player;
- requiring a centralized MediaOps cloud service for self-hosted users;
- supporting every provider before the first public release.

## Product constraints

MediaOps should favor:

- simple workflows;
- minimal privileges;
- small and understandable configuration surfaces;
- provider APIs instead of direct filesystem access when possible;
- persistent state that survives container upgrades;
- clear separation of secrets from source code;
- gradual extension rather than premature framework design.

## Success criteria

MediaOps is succeeding when a user can enter a Discord channel, understand what to do without reading a manual, and complete common media tasks safely while the administrator retains full control of their own infrastructure.
