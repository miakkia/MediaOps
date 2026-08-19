# Architecture Principles

MediaOps is designed as a self-hosted media operations platform with Discord as its current primary interface. The architecture should remain easy to understand, safe to operate, and adaptable to additional media providers and deployment models.

## 1. Simplicity before abstraction

MediaOps should solve real user problems with the fewest reasonable steps.

Architecture exists to support that simplicity, not to create layers for their own sake.

A new abstraction should be introduced when it removes meaningful duplication, isolates a real integration boundary, or enables a concrete future requirement.

## 2. Keep Discord separate from provider details

Discord commands and interaction handlers should operate on MediaOps domain concepts rather than raw Emby, Jellyfin, or Plex payloads.

Preferred direction:

```text
Discord
  -> MediaOps service/domain layer
      -> Media provider adapter
      -> Watch Party provider adapter
      -> persistence
```

Discord code should not become the place where HTTP requests, provider metadata normalization, persistent storage, and business rules are all mixed together.

## 3. Media provider and Watch Party provider are separate concerns

A media server provides library data. A synchronized playback system provides Watch Party/session behavior.

These capabilities may come from the same ecosystem, but MediaOps should not assume they are the same integration.

Long-term model:

```text
MediaProvider
├── Emby
├── Jellyfin
└── Plex

WatchPartyProvider
├── Emby-compatible service
├── Jellyfin-compatible solution
└── Plex Watch Together integration
```

This separation allows MediaOps to preserve one Discord experience while adapting backend behavior per provider.

## 4. Normalize provider metadata

Provider-specific responses should be converted into stable MediaOps domain types.

Common media metadata should include, where available:

- provider item ID;
- display title;
- original title;
- sort title;
- production year;
- overview;
- media type;
- creation/addition date.

Matching logic should use normalized metadata rather than relying on provider result ordering alone.

## 5. Shared business logic belongs in shared services

When two interaction paths perform the same operation, they should converge on one implementation.

For example, Watch Party scheduling may be initiated from a slash command, a random-movie flow, or a setup-panel modal. Persistence and public announcement creation should still happen through the same scheduling service.

This reduces drift and inconsistent behavior.

## 6. Treat all external input as untrusted

External boundaries include:

- Discord slash-command options;
- button custom IDs;
- modal submissions;
- media provider API responses;
- environment variables;
- persisted runtime JSON.

Validate format, length, type, and allowed values before using data in downstream operations.

## 7. Secrets are deployment data, not source code

Tokens, passwords, API keys, certificates, and private runtime state must not be committed.

The repository should contain only sanitized configuration examples.

Provider credentials should be injected at runtime through environment variables or equivalent deployment secret/configuration mechanisms.

## 8. Runtime state is separate from source

Persistent Watch Party records and future configuration/state belong in a dedicated data directory.

Source code must not depend on mutable files inside the repository tree for production operation.

For container deployments, runtime state should map to a persistent volume such as `/data`.

## 9. Safe failure over hidden failure

MediaOps should fail explicitly when required configuration is missing or provider responses are malformed.

User-facing failures should remain safe and understandable. Technical details belong in logs, not in public Discord messages.

External HTTP integrations should use bounded timeouts and deliberate redirect behavior.

## 10. Public UX should remain provider-agnostic

Normal Discord users should not need to understand provider APIs or internal architecture.

Actions should remain recognizable across providers:

- search movie;
- search TV;
- latest additions;
- random movie;
- schedule Watch Party;
- RSVP;
- join/open synchronized playback.

Provider-specific complexity stays behind adapters.

## 11. Self-hosted is a first-class deployment model

MediaOps should remain usable with user-owned infrastructure and a user-owned Discord bot.

A future hosted edition may exist, but it must not require weakening the self-hosted architecture.

The same core domain behavior should be reusable in both deployment modes wherever practical.

## 12. Container security by default

The production container should target:

- non-root execution where practical;
- no privileged mode;
- no direct media-library mounts unless a real feature requires them;
- minimal network exposure;
- persistent appdata only for MediaOps-owned state;
- runtime secrets rather than baked credentials;
- health checks and bounded resource usage.

## 13. Documentation is part of the architecture

Architecture decisions become fragile when they live only in developer memory.

Provider boundaries, trust assumptions, persistence rules, deployment expectations, and major UX decisions should be documented alongside the code.

## 14. Build for extension without predicting everything

MediaOps should be ready to support Jellyfin, Plex, additional request systems, and alternate Watch Party backends, but current code should not be distorted by speculative requirements.

The goal is a stable core with clear integration boundaries, not an over-generalized framework.
