# Public release readiness

MediaOps has completed the main feature and hardening work for its first public release candidate. The final acceptance process now validates the **self-hosted, single-tenant** deployment model from public documentation and published images.

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

## V1 Discord deployment decision

The first public release is not a universal hosted/multi-tenant bot.

- Each operator creates and owns their own Discord application/bot.
- Each operator runs their own MediaOps container.
- The container's Emby/Ombi/Watch Party credentials apply to that deployment.
- One v1 instance must not be presented as a universal bot for unrelated guilds with different backends.
- The MediaOps Community bot is a restricted demo bot only.

This is documented in `DISCORD_BOT_SETUP.md`, `RELEASE_SCOPE_V1.md`, and `KNOWN_LIMITATIONS.md`.

## Fresh-install progress already validated

A clean Portainer/ADM installation using the public `:latest` image has already demonstrated:

- creation/use of a dedicated Discord application and bot;
- bot connection to a fresh guild;
- runtime `npm run deploy-commands` registration of all 15 commands;
- `/health` reporting the expected `latest` build and provider connectivity;
- `/mediaops-setup`, `/watchparty-setup`, and `/mediaops-admin-setup` publication;
- `/movie`, `/tv`, and `/latest` against Emby;
- `/request` search and real Ombi request creation.

The clean-install acceptance test remains open until the optional router/Forum, Watch Party lifecycle, persistence/recreation, and final screenshot/publication checks are complete.

## Remaining blockers before tagging the first public release

### 1. Self-hosted Discord bot documentation

- Verify `DISCORD_BOT_SETUP.md` from a clean operator perspective.
- Confirm recommended gateway intents and least-privilege bot permissions.
- Confirm the guide explains that `Manage Server` is a human command permission, not a required bot permission.
- Confirm operators understand how to disable public installation after adding their bot to the intended guild.

### 2. Exact-release build validation

From the final merged `main` commit:

- run typecheck, automated tests, and dependency audit;
- build both published images;
- verify the release candidate SHA/version through `/health`;
- verify GHCR pullability without relying on locally cached development images.

### 3. Finish clean-install acceptance

Remaining acceptance work:

1. deploy the optional Ombi Discord Router as an independent fresh instance;
2. create/validate its own Discord Forum webhook and tag configuration;
3. validate one request lifecycle through Requested -> Processing -> Available/Failed/Denied as applicable;
4. schedule a Watch Party and RSVP;
5. receive exactly one T-15 reminder;
6. confirm automatic room opening and direct join link;
7. cancel the active Watch Party as organizer;
8. confirm tracked Discord posts are cleaned up on the lifecycle pass;
9. verify `/watchparty-upcoming` and `/watchparty-status`;
10. restart/recreate containers and verify persistent state survives.

### 4. Secret and privacy check

Before tagging:

- confirm no Discord tokens, webhook credentials, Ombi/Emby API keys, passwords, private hostnames, private IP addresses, or personal credentials are committed;
- inspect screenshots for secrets, private addresses, personal usernames, and unrelated server information;
- verify runtime logs do not print secrets;
- rotate any credential accidentally exposed during testing.

### 5. Public presentation

After the clean-install pass:

- capture sanitized screenshots of the MediaOps setup panel, media/request flow, Watch Party panel/scheduling/open-room flow, and optionally admin health diagnostics;
- add only the strongest screenshots to GitHub documentation;
- use MediaOps Community Discord for broader examples/support content;
- prepare release notes from `CHANGELOG.md`.

### 6. Unraid Community Apps preparation

Before submission:

- install once from the public templates as a clean user would;
- verify the Discord bot creation guide is linked from the Unraid path;
- run the current Community Apps **Validate** workflow;
- run the current Community Apps **Scan** workflow;
- resolve every reported template/metadata issue;
- confirm descriptions, support/project links, icons, defaults, paths, and secret fields are appropriate for public users;
- submit only after the tagged public image and documentation are stable.

## Non-blocking post-release work

- official universal multi-tenant MediaOps bot architecture;
- per-guild provider configuration and encrypted tenant secret storage;
- optional local-agent model for private backend connectivity;
- Jellyfin support;
- Plex support;
- additional request providers;
- richer Watch Party administration/moderation;
- additional localization;
- configurable reminder policies;
- broader deployment presets;
- additional Discord UI polish.

## Release philosophy

The first public release is intentionally a small, documented, reproducible, and safe self-hosted baseline. Its advertised Emby/Ombi/Watch Party workflows should work reliably for a new operator without silently sharing one deployment's backend with unrelated Discord guilds.
