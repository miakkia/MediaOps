# Public release readiness

MediaOps is approaching its first public development release. This checklist separates the features that are already validated from the work that should block a public release.

## Validated development baseline

- Discord bot health reporting with build channel and SHA.
- Emby connectivity and media lookup.
- Ombi request provider integration.
- Discord Forum request lifecycle through the companion Ombi router.
- Request lifecycle recovery and idempotent Forum status updates.
- Scheduled Watch Parties with RSVP state.
- Persistent Watch Party lifecycle state.
- T-15 Watch Party reminders.
- Automatic Watch Party room creation at scheduled start.
- Organizer cancellation before and after room activation.
- Cleanup of tracked public Watch Party posts after cancellation.
- Runtime-aware expiry and fallback expiry behavior.
- Concurrent persistent-store mutations are serialized.
- TypeScript typecheck, automated test suite, and npm audit are part of development validation.

## Blockers before first public release

### 1. Merge and establish a clean release baseline

- Merge the current Watch Party reminder/lifecycle work to `main` after final review and CI.
- Re-run typecheck, tests, and dependency audit from the merged `main` branch.
- Build and smoke-test the release candidate images from the exact release commit.

### 2. Reconcile release-readiness hardening

The historical `harden/release-readiness-v1` branch predates substantial request and Watch Party work and must not be merged wholesale. Review its still-relevant hardening changes against current `main`, then port only the pieces that remain useful and are not already superseded.

### 3. Fresh-install documentation

A new operator must be able to deploy MediaOps without relying on the maintainer's homelab configuration.

Verify and document:

- required Discord application permissions and intents;
- Discord channel/forum/tag setup;
- Emby connection and credentials;
- Ombi provider configuration and Discord-to-Ombi user mapping;
- companion router deployment and persistent `/data` storage;
- Watch Party service URL/authentication requirements;
- required Docker networks and service reachability;
- persistent MediaOps data directory;
- timezone and locale configuration;
- a minimal working `.env` example with no real credentials.

### 4. Secret and configuration audit

Before tagging a public release:

- confirm no Discord tokens, webhook tokens, Ombi API keys, Emby API keys, private hostnames, or personal credentials are committed;
- ensure examples use placeholders rather than maintainer-specific secrets;
- verify runtime logs do not print secrets;
- document credential rotation if a secret is accidentally exposed.

### 5. Container and release pipeline

- Verify GHCR publishing for both the MediaOps bot and Ombi Discord router.
- Define the public image/tag policy (`latest`, versioned tags, and development tags).
- Ensure image metadata identifies the source commit/version.
- Verify a clean pull on a host with no local MediaOps images.
- Verify persistent data survives container replacement/update.
- Confirm the Unraid templates reference public images and contain safe defaults.

### 6. Public project metadata

Before the first public release, confirm the repository has current versions of:

- README with feature scope and installation path;
- LICENSE;
- SECURITY policy;
- CONTRIBUTING guide;
- CODE_OF_CONDUCT;
- changelog/release notes;
- support/issue guidance and known limitations.

### 7. Fresh-install acceptance test

Perform one clean deployment using only the public documentation and release images. The acceptance pass should include:

1. Bot starts and `/health` reports the expected release SHA/version.
2. Emby movie/TV lookup succeeds.
3. Ombi request submission succeeds for a mapped normal Discord user.
4. Request Forum post is created and follows approval/processing/available state changes.
5. Watch Party can be scheduled and RSVP'd to.
6. T-15 reminder is emitted once.
7. Room opens at the scheduled time.
8. Organizer can cancel an active Watch Party.
9. Tracked public Watch Party posts are cleaned up after cancellation.
10. Container restart preserves request/Watch Party persistent state.

## Non-blocking post-release work

These can evolve after the first public development release unless a later review promotes them to blockers:

- Jellyfin support;
- Plex support;
- additional request providers;
- richer Watch Party administration and moderation;
- additional localization;
- more configurable reminder policies;
- broader media-server and deployment presets;
- UI/UX polish and additional Discord presentation options.

## Release philosophy

The first public release does not need every planned MediaOps integration. It should instead provide a small, documented, reproducible and safe baseline whose advertised features work reliably. New media servers and optional workflows can then be developed incrementally without destabilizing that baseline.
