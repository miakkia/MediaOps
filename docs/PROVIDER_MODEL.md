# Provider Model

MediaOps uses provider abstractions so Discord features can work against normalized media/request interfaces instead of hard-coding one backend.

## Current status

Media providers currently supported:

- **Emby**
- **Jellyfin**

Request providers currently supported:

- **Ombi**
- **Seerr**

Plex remains future work. Jellyfin SyncPlay orchestration is also future work and is intentionally separate from the basic Jellyfin media-library adapter.

## Runtime selection

Provider selection is configuration-driven:

```env
MEDIA_PROVIDER=emby
REQUEST_PROVIDER=ombi
```

or:

```env
MEDIA_PROVIDER=jellyfin
REQUEST_PROVIDER=seerr
```

Only the selected implementation is initialized. Unselected providers do not require their URL/API-key variables.

Unsupported provider values fail fast rather than silently falling back to another backend.

## MediaProvider boundary

Shared Discord/media workflows call the normalized `MediaProvider` interface for operations such as:

- system information;
- movie search;
- series search;
- latest additions;
- random movie selection;
- exact movie lookup;
- poster/artwork retrieval where supported.

Provider adapters translate native API responses into MediaOps media objects before commands consume them.

### Emby adapter

Emby remains fully supported and is the original reference provider. Existing Emby deployments do not need to migrate when upgrading to a release that also supports Jellyfin.

### Jellyfin adapter

Jellyfin is implemented as its own adapter rather than being treated as interchangeable with Emby. Current implementation includes:

- authenticated system-information lookup;
- movie search;
- series search;
- latest additions;
- server-side random movie selection;
- exact movie lookup;
- Primary poster retrieval;
- event artwork fallback using Banner then Backdrop;
- defensive response validation;
- bounded requests;
- redirect blocking;
- API token sent in request headers, not Discord-visible URLs.

Jellyfin SyncPlay control is not part of the current media-provider implementation.

## RequestProvider boundary

The request-provider layer normalizes search/request/status operations while allowing approval policy to remain provider-owned.

### Ombi

Ombi remains supported. MediaOps no longer exposes `OMBI_AUTO_APPROVE`; approval behavior belongs to Ombi's configured user/role policy. MediaOps does not need to call a separate approval endpoint simply to reproduce policy that Ombi already owns.

### Seerr

The Seerr adapter uses `/api/v1`, authenticates with `X-Api-Key`, and supports:

- health/status checks;
- media search;
- movie request creation;
- TV/series request creation (all seasons for the current Discord workflow);
- provider request IDs;
- request status lookup and normalized state mapping.

MediaOps does not use Seerr's elevated explicit approval endpoint to override Seerr's configured user auto-approval policy.

## Request availability authority

Request-provider state and media-library availability are separate concepts.

MediaOps request tracking verifies the selected media provider when deciding that requested content is actually available in the library. This protects the MediaOps notification path from a request provider being manually marked `Available` while the title is absent from Emby/Jellyfin.

Third-party native Discord notification agents remain outside this guarantee; if operators require authoritative final availability announcements, the request provider's direct `Available` notification should not bypass MediaOps verification.

## Media provider vs Watch Party provider

Media-library access and synchronized playback remain separate concerns.

Current Emby Watch Party integration is not automatically replaced simply because `MEDIA_PROVIDER=jellyfin` is selected. Native Jellyfin SyncPlay orchestration is planned as a distinct feature so its permissions/session lifecycle can be designed and tested independently.

## MediaOps Discord Router

The companion Discord Router is a messaging/routing addon, not a validation authority.

Provider adapters currently accept:

```text
POST /ombi
POST /seerr
```

They normalize webhook payloads into the router's internal event format. The router can then create/update Discord Forum threads, persist thread associations, and maintain lifecycle tags.

The router does not decide whether a provider's `Available` event is truthful. MediaOps Core owns media-server verification where that guarantee is required.

## Security boundary

Provider adapters are responsible for keeping credentials scoped to the configured endpoint and validating external input.

Rules include:

- secrets never embedded in Discord URLs;
- no query-string API keys for the Jellyfin/Seerr clients;
- redirects blocked where forwarding credentials would be unsafe;
- bounded input/search/identifier handling;
- defensive parsing of provider responses;
- unselected provider secrets not required;
- raw tokens/API keys never returned to Discord users or logs.

## Testing expectations

Provider changes require automated coverage for normal parsing and failure cases. The current Jellyfin and Seerr implementations include tests for client behavior, provider selection, media/request parsing, status mapping, artwork handling, and security-sensitive request behavior.

Real integration testing should still be performed against disposable/private provider instances before marking a new provider workflow confirmed functional.

## Architectural rule

Provider-specific complexity belongs behind provider boundaries. Shared Discord command code should not require a new command implementation merely because another media/request backend is added.
