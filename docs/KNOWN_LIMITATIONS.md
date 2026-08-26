# Known limitations

This file describes intentional limitations of the first MediaOps public release candidate. These are not release blockers unless `RELEASE_READINESS.md` explicitly promotes one to a blocker.

## Media providers

Emby is the supported and validated media provider for the first public release. Jellyfin and Plex are planned but are not included in this release.

## Request providers

Ombi is the supported and validated request provider. Additional request providers can be added later through the provider abstraction.

## Watch Party provider

The current Watch Party integration targets Emby Watch Party. MediaOps orchestrates that external service; its availability, authentication, browser compatibility, and playback behavior remain separate runtime dependencies.

## Discord command registration

Commands are currently guild-scoped and must be synchronized after initial installation and after releases that change command definitions. The published container supports this directly with:

```bash
docker exec <mediaops-container> npm run deploy-commands
```

## Discord permissions

Administrative setup and diagnostic commands use Discord Manage Server permission by default. More granular configurable role policies are planned after the first release.

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

The documented first-release deployment targets Docker-compatible hosts, Portainer/Compose, and Unraid. A dedicated graphical installer, hosted service, Kubernetes chart, and platform-specific packages are not part of this release.
