# Known limitations

This file tracks intentional limitations of the current MediaOps development baseline. They are not necessarily release blockers unless listed in `RELEASE_READINESS.md`.

## Media servers

The currently validated media-server workflow is Emby. Jellyfin and Plex support are planned but are not part of the first public development-release baseline.

## Request providers

Ombi is the currently validated request provider. Additional providers can be added later through the provider abstraction.

## Ombi notifications

Ombi notification behavior depends on the Ombi user/role and the notification event. In particular, Ombi administrators may not emit the same `NewRequest` webhook event as API, Power User, or normal-user requests. MediaOps' request flow and companion router therefore must not assume that every Ombi actor produces an identical event sequence.

## Watch Party cleanup timing

Public announcement cleanup is performed by the Watch Party lifecycle scheduler. Cancellation state is persisted immediately, while Discord message deletion can occur on the following scheduler pass rather than in the same instant as the interaction.

## Legacy Watch Party records

Older persisted Watch Party records can predate tracking of launch/reminder Discord message IDs. They remain readable, but MediaOps cannot reliably delete an old Discord message whose ID was never stored. Such legacy posts can require manual cleanup.

## Watch Party service

MediaOps orchestrates the external Watch Party service; availability, authentication and media playback behavior of that service remain separate runtime dependencies.
