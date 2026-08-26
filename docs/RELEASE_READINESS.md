# Public release readiness

MediaOps has completed the main feature and hardening work for its first public release candidate. This checklist now focuses on proving that the published package can be installed and operated by a new user from public documentation alone.

## Validated baseline

- Discord bot health reporting with build channel and SHA.
- Emby connectivity, movie/TV lookup, and recently-added discovery.
- Ombi request-provider integration and requester attribution.
- Optional Discord Forum request lifecycle through the companion Ombi router.
- Persistent request tracking and lifecycle recovery.
- 15 guild-scoped Discord commands with persistent user/admin setup panels.
- Admin diagnostics and setup commands protected by Manage Server by default.
- Scheduled Watch Parties with RSVP state.
- T-15 reminder with restart-safe deduplication.
- Automatic Watch Party room creation at scheduled start.
- Organizer cancellation before and after room activation.
- Cleanup of tracked scheduled/reminder/open-room Discord posts.
- Runtime-aware expiry plus a 4.5-hour fallback.
- Serialized persistent-store mutations.
- Configurable generic public branding.
- Production-container command deployment using compiled JavaScript (`npm run deploy-commands`).
- TypeScript typecheck, automated tests, dependency audit, application build, and container builds in CI.

## Remaining blockers before tagging the first public release

### 1. Merge final documentation truth pass

- README and feature documentation must describe the exact release behavior.
- Docker/Portainer and Unraid paths must use public images and generic placeholders.
- Known limitations and release scope must remain explicit.
- No transitional maintainer-only wording should remain in the public installation path.

### 2. Exact-release build validation

From the final merged `main` commit:

- run typecheck, automated tests, and dependency audit;
- build both published images;
- verify the release candidate SHA/version through `/health`;
- verify GHCR pullability without relying on locally cached development images.

### 3. Fresh-install acceptance test

Perform one clean deployment using only the public documentation and published images. Prefer a host/environment that does not contain the maintainer's existing MediaOps appdata.

Acceptance pass:

1. Create persistent MediaOps data storage.
2. Configure a Discord application/bot, guild ID, Emby credentials, and optional Ombi/Watch Party integrations from documented fields only.
3. Start the container successfully.
4. Run `docker exec <container> npm run deploy-commands` successfully from the published runtime image.
5. Confirm `/health` reports the expected release build/provider health.
6. Publish `/mediaops-setup`, `/watchparty-setup`, and `/mediaops-admin-setup` in appropriate test channels.
7. Validate `/movie`, `/tv`, and `/latest`.
8. Validate `/request` with a mapped normal Discord/Ombi user when Ombi is enabled.
9. Validate one Forum request lifecycle when the optional router is enabled.
10. Schedule a Watch Party, RSVP, receive one T-15 reminder, and confirm automatic room opening/direct join link.
11. Cancel the active Watch Party as organizer and confirm tracked Discord posts are cleaned up on the lifecycle pass.
12. Verify `/watchparty-upcoming` and `/watchparty-status`.
13. Restart/recreate the container and verify persistent state survives.

### 4. Secret and privacy check

Before tagging:

- confirm no Discord tokens, webhook credentials, Ombi/Emby API keys, passwords, private hostnames, private IP addresses, or personal credentials are committed;
- inspect screenshots before publication for secrets, private addresses, personal usernames, and unrelated server information;
- verify runtime logs do not print secrets;
- rotate any credential accidentally exposed during testing.

### 5. Public presentation

After the clean-install pass:

- capture a small set of sanitized screenshots showing the MediaOps setup panel, media/request flow, Watch Party panel/scheduling/open-room flow, and optionally admin health diagnostics;
- add only the strongest screenshots to GitHub documentation;
- use the MediaOps Community Discord for broader examples/support content;
- prepare release notes from `CHANGELOG.md`.

### 6. Unraid Community Apps submission preparation

The repository already contains `ca_profile.xml`, the main/companion templates, icon, GPLv3 license, project links, and public GHCR image references. Before submission:

- install once from the public templates as a clean user would;
- run the current Community Apps **Validate** workflow;
- run the current Community Apps **Scan** workflow;
- resolve every reported template/metadata issue;
- confirm descriptions, support/project links, icons, defaults, paths, and secret fields are appropriate for public users;
- submit only after the tagged public image and documentation are stable.

## Non-blocking post-release work

- Jellyfin support;
- Plex support;
- additional request providers;
- richer Watch Party administration/moderation;
- additional localization;
- configurable reminder policies;
- broader deployment presets;
- additional Discord UI polish;
- optional hosted/SaaS operation.

## Release philosophy

The first public release is intentionally a small, documented, reproducible, and safe baseline. Its advertised Emby/Ombi/Watch Party workflows should work reliably for a new operator before additional providers or features are added.
