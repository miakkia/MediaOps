# Provider Model

MediaOps uses a provider abstraction so Discord features can work against a normalized media interface instead of calling a specific media server directly.

## Current status

The `MediaProvider` boundary is implemented.

Current runtime flow:

```text
Discord / Watch Party workflows
            |
            v
       MediaProvider
            |
       Emby adapter
            |
         Emby API
```

Emby is the first and currently supported provider. Jellyfin and Plex remain planned future adapters.

Application-level consumers now call generic provider methods rather than importing Emby-specific functions directly. The Emby service is isolated behind the Emby provider implementation.

## Why the provider model exists

Discord users think in terms of actions:

- find a movie;
- find a TV series;
- see what is new;
- choose something at random;
- schedule a Watch Party.

They should not need to know how the underlying server represents those operations.

Provider-specific behavior therefore belongs behind adapters.

## MediaProvider contract

The current provider contract normalizes capabilities including:

- system/server information;
- movie search;
- TV/series search;
- latest additions;
- random movie selection;
- exact movie lookup by provider ID;
- normalized media metadata.

The current normalized media model includes values such as:

```ts
interface MediaItem {
  id: string;
  name: string;
  originalTitle: string | undefined;
  sortName: string | undefined;
  year: number | undefined;
  overview: string | undefined;
  type: 'Movie' | 'Series' | undefined;
  dateCreated: string | undefined;
}
```

Provider adapters translate native provider responses into this stable representation before the Discord or Watch Party layers consume them.

## Provider selection

Runtime provider selection is configuration-driven:

```env
MEDIA_PROVIDER=emby
```

The application creates the configured implementation through a central provider instance/factory boundary. Normal command and Watch Party code does not repeatedly inspect `MEDIA_PROVIDER`.

Unsupported provider values fail fast during startup rather than silently falling back to an unintended backend.

## Current Emby adapter

The Emby adapter is the reference implementation and currently supports:

- system information;
- movie search;
- series search;
- latest additions;
- exact movie lookup;
- full-library random movie selection;
- display/original/sort title metadata;
- validated API responses;
- bounded HTTP timeout;
- redirect blocking;
- API-token authentication through runtime configuration.

The Emby-specific HTTP client remains isolated in the service layer and is consumed by the Emby provider adapter.

## Title matching

Media providers may localize display titles differently from the names users know.

MediaOps therefore avoids relying only on provider display title or result ordering when scheduling a specific movie.

Where metadata is available, matching considers:

1. display/title name;
2. original title;
3. sort title;
4. provider result ranking as a fallback.

Normalization includes whitespace cleanup, case-insensitive comparison and accent normalization where appropriate.

## Media provider vs Watch Party provider

Media-library access and synchronized playback are separate concerns.

A future `WatchPartyProvider` may expose capabilities such as:

- open/create session URL;
- validate a session code or identifier;
- generate a join URL;
- determine whether a synchronized session is active;
- provider-specific synchronized-playback automation where supported.

Keeping these concerns separate allows MediaOps to support a media library provider even when equivalent Watch Party automation is unavailable or implemented through another service.

## Jellyfin direction

Jellyfin is a strong candidate for the first additional media adapter because its media model is historically related to Emby.

It should still be implemented and tested as its own provider rather than assuming API compatibility.

Potential implementation phases:

1. system information and authentication;
2. search and normalized metadata;
3. latest additions and random selection;
4. exact lookup;
5. provider-specific capability reporting;
6. synchronized-playback research as a separate Watch Party concern.

## Plex direction

Plex should use a dedicated adapter that translates Plex-specific metadata, libraries and identifiers into MediaOps domain objects.

Potential implementation phases:

1. server connection and authentication;
2. library discovery;
3. movie/series search;
4. latest additions;
5. random movie selection;
6. exact metadata lookup;
7. provider-specific capability reporting;
8. Plex Watch Together research as a separate Watch Party integration.

## Capability differences

Not all providers will necessarily support identical operations.

A future capability model should allow MediaOps to represent optional features explicitly rather than pretending unsupported operations exist.

Example direction:

```ts
interface MediaProviderCapabilities {
  searchMovies: boolean;
  searchSeries: boolean;
  latestItems: boolean;
  randomMovie: boolean;
  exactLookup: boolean;
}
```

Discord UX can then hide, disable or explain unavailable features gracefully.

## Security boundary

Provider adapters are responsible for validating external responses and keeping credentials scoped to the configured provider endpoint.

Adapters should validate:

- provider configuration;
- endpoint protocol/URL expectations;
- HTTP status;
- timeout behavior;
- provider response shape;
- item identifiers;
- required metadata.

Raw tokens, API keys and sensitive response details must never be surfaced to Discord users.

## Testing expectations

Every provider adapter should eventually have automated tests covering:

- valid response parsing;
- malformed response rejection;
- empty-library behavior;
- title matching;
- exact lookup;
- random-selection bounds;
- authentication/error behavior;
- capability reporting.

Provider fixtures must remain sanitized and contain no real credentials.

## Architectural rule

Provider complexity must stay behind the provider boundary. If normal Discord commands or shared Watch Party scheduling code begin importing provider-specific services directly, the architecture has regressed and should be corrected.
