# Provider Model

MediaOps currently integrates directly with Emby, but the long-term product should support multiple media ecosystems without forcing Discord features to be rewritten for every provider.

## Why a provider model exists

Discord users think in terms of actions:

- find a movie;
- find a TV series;
- see what is new;
- choose something at random;
- schedule a Watch Party;
- join synchronized playback.

They should not need to know whether those actions are backed by Emby, Jellyfin, Plex, or another provider.

Provider-specific behavior therefore belongs behind adapters.

## Two provider categories

MediaOps should distinguish between two integration types.

### Media provider

A `MediaProvider` supplies library and metadata capabilities.

Expected capabilities may include:

- server/system health;
- movie search;
- TV/series search;
- latest additions;
- random movie selection;
- exact item lookup by provider ID;
- normalized metadata.

### Watch Party provider

A `WatchPartyProvider` supplies synchronized-session behavior.

Expected capabilities may include:

- open/create session URL;
- validate a session code or identifier;
- generate a join URL;
- determine whether a session is active;
- provider-specific synchronized-playback integration where APIs allow it.

The two provider types should remain separate because a media library integration may be available before synchronized Watch Party automation is available for that ecosystem.

## Normalized media model

Provider responses should be converted into a stable MediaOps representation.

A normalized media item should expose fields similar to:

```ts
interface MediaItem {
  id: string;
  name: string;
  originalTitle?: string;
  sortName?: string;
  year?: number;
  overview?: string;
  type?: 'Movie' | 'Series';
  dateCreated?: string;
}
```

The exact interface may evolve, but Discord commands should consume normalized values rather than raw provider JSON.

## Title matching

Media providers may localize display titles differently from the names users know.

MediaOps should therefore avoid relying only on the display title or provider search ordering.

Where provider metadata supports it, matching should consider:

1. display/title name;
2. original title;
3. sort title;
4. provider result ranking as a fallback.

Normalization may include case folding, whitespace cleanup, and accent-insensitive comparison where appropriate.

## Current Emby implementation

Emby is the current reference provider.

The implementation currently supports:

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

As the provider architecture evolves, these capabilities should move behind the common provider contract without changing the Discord-facing behavior.

## Jellyfin direction

Jellyfin is a strong candidate for the first additional media provider because its API and media model are closely related to Emby's historical model.

Implementation should still be treated as a separate adapter and validated against current Jellyfin APIs rather than assuming full compatibility.

Potential phases:

1. health/system information;
2. search and normalized metadata;
3. latest and random selection;
4. exact lookup;
5. synchronized-playback/Watch Party research and adapter work.

## Plex direction

Plex should use a dedicated adapter rather than attempting to imitate Emby's API model internally.

The adapter should translate Plex-specific metadata and identifiers into MediaOps domain objects.

Potential phases:

1. server connection and authentication;
2. library discovery;
3. movie/series search;
4. latest additions;
5. random movie selection;
6. exact metadata lookup;
7. Plex Watch Together capability research and integration where technically supported.

## Capability differences

Not all providers will support identical operations.

The provider layer should eventually expose capabilities explicitly rather than pretending unsupported features exist.

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

A Watch Party provider may have a separate capability set.

Discord UX can then disable, hide, or explain unavailable actions gracefully.

## Provider selection

A future self-hosted configuration may use a setting such as:

```env
MEDIA_PROVIDER=emby
```

with future values including:

```text
jellyfin
plex
```

Provider-specific credentials should use clearly scoped configuration variables and remain runtime-only secrets.

## Provider factory direction

The application may eventually construct the configured adapter through a small provider factory:

```text
configuration
    -> provider factory
        -> EmbyProvider | JellyfinProvider | PlexProvider
```

The rest of MediaOps should receive the resulting provider interface rather than repeatedly inspecting `MEDIA_PROVIDER` throughout the codebase.

## Error handling

Provider adapters are responsible for translating provider-specific failures into meaningful MediaOps errors where practical.

They should validate:

- configuration;
- HTTP status;
- timeout behavior;
- provider response shape;
- item identifiers;
- required metadata.

Raw tokens and sensitive response details must never be surfaced to Discord users.

## Testing providers

Every provider adapter should eventually have tests for:

- valid response parsing;
- malformed response rejection;
- empty-library behavior;
- title matching;
- exact item lookup;
- random selection bounds;
- authentication/error behavior;
- capability reporting.

Provider-specific fixtures should remain sanitized and contain no real server credentials.

## Architectural rule

The provider model exists to preserve a simple MediaOps UX across different media ecosystems.

If provider complexity starts leaking into normal Discord commands, the boundary should be reconsidered.
