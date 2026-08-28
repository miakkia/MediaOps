# Known limitations

This file describes intentional limitations of the MediaOps v1 self-hosted baseline currently being prepared for public v1.0.0 release. These are not release blockers unless `RELEASE_READINESS.md` explicitly promotes one to a blocker.

## Self-hosted single-tenant Discord model

MediaOps v1 is not a universal hosted Discord bot. Each operator creates their own Discord application/bot and runs their own MediaOps instance.

The Emby, Ombi, Watch Party, locale, timezone, and related provider configuration is global to the MediaOps container. MediaOps does not yet maintain isolated provider credentials per Discord guild.

A bot identity can technically be added to multiple guilds through Discord, but a v1 MediaOps instance should **not** be invited into unrelated guilds that need different backend configuration. Doing so could cause those guilds to interact with the backend configured for that container.

The public MediaOps Community demo bot is intentionally restricted to the project/community demo environment. See `DISCORD_BOT_SETUP.md` for the supported v1 setup.

## Future multi-tenant operation

An official universal MediaOps bot is a future architecture item. Safe multi-tenant operation requires per-guild configuration, tenant isolation, encrypted secret storage, onboarding/authorization controls, and a secure connectivity model for private Emby/Ombi/Watch Party services.

## Media providers

Emby is the supported and validated media provider for v1. Jellyfin and Plex are planned but are not included in this release.

Current `/movie` and `/tv` commands return matching library results; richer interactive media-detail cards/actions are a post-v1 roadmap item rather than current v1 behavior.

## Request providers

Ombi is the supported and validated request provider. Additional request providers can be added later through the provider abstraction.

## Watch Party provider

The current Watch Party integration targets the external open-source [Oratorian/emby-watchparty](https://github.com/Oratorian/emby-watchparty) project. MediaOps orchestrates the Discord-side scheduling and lifecycle; availability, authentication, browser compatibility, and synchronized playback behavior of the Watch Party service remain separate runtime dependencies.

## Discord command registration

Commands are currently guild-scoped and must be synchronized after initial installation and after releases that change command definitions. The published container supports this directly with:

```bash
docker exec <mediaops-container> npm run deploy-commands
```

## Discord permissions

Administrative setup and diagnostic commands use Discord Manage Server permission by default. More granular configurable role policies are planned after the first release.

The initial Watch Party RSVP announcement can use `@here`; Discord must allow the bot to mention `@everyone`, `@here`, and roles for that notification to reach members as intended.

## Internationalization

MediaOps has an EN/FR foundation and bilingual public Watch Party guidance, but not every user-facing string is fully localized yet.

## Ombi notifications

Ombi notification behavior can vary by Ombi user/role and notification event. In particular, Ombi administrators may not emit the same `NewRequest` webhook sequence as API, Power User, or normal-user requests. The MediaOps request flow and companion router therefore do not assume every Ombi actor produces an identical event sequence.

## Watch Party cleanup timing

Cancellation state is persisted immediately, while Discord message deletion is lifecycle-scheduler driven and can occur on the following scheduler pass rather than at the exact instant the organizer presses Cancel.

## Watch Party fallback expiry

When Emby runtime information is available, active expiry is based on the movie runtime plus a 45-minute grace period. When runtime cannot be read, MediaOps uses a 4.5-hour safety fallback.

## Legacy Watch Party records

Persisted records created before launch/reminder message tracking remain readable, but MediaOps cannot delete a historical Discord message whose ID was never stored. Such legacy posts can require manual cleanup. Clean first-time public installations are not affected by this migration limitation.

## Deployment scope

The documented v1 deployment targets Docker-compatible hosts, Portainer/Compose, and Unraid. A dedicated graphical installer, hosted service, Kubernetes chart, platform-specific package, and central multi-tenant control plane are not part of this release.
