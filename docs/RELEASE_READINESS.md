# Public release readiness

MediaOps has completed the main feature, hardening, and clean-install work for its first public self-hosted release. The remaining gate is primarily public-repository, distribution, and release presentation validation.

## Validated v1 baseline

- Self-hosted, single-tenant deployment with an operator-owned Discord application/bot.
- 15 guild-scoped Discord commands with persistent user/admin setup panels.
- Discord health reporting with build channel and SHA.
- Emby connectivity, movie/TV lookup, recently-added discovery, exact item lookup, and random movie selection.
- Ombi request-provider integration, requester attribution, optional auto-approval, persistent tracking, and availability notification.
- Optional Discord Forum request lifecycle through the companion Ombi Discord Router.
- Scheduled Watch Parties with RSVP state, T-15 reminder, automatic room creation, direct join links, organizer cancellation, cleanup, and persistent lifecycle state.
- Runtime-aware Watch Party expiry plus a 4.5-hour fallback.
- Watch Party modal scheduling interpreted in `MEDIAOPS_TIMEZONE`, independent of the container process timezone.
- Initial RSVP announcement supports `@here` notification when Discord permissions allow it.
- Serialized persistent-store mutations.
- Configurable generic public branding.
- Production-container command deployment using compiled JavaScript (`npm run deploy-commands`).
- Docker/GHCR, Portainer/Compose, and Unraid deployment paths.
- Main and companion router containers use hardened production defaults appropriate to their roles.

## V1 Discord deployment decision

The first public release is not a universal hosted/multi-tenant bot.

- Each operator creates and owns their own Discord application/bot.
- Each operator runs their own MediaOps container.
- The container's Emby/Ombi/Watch Party credentials apply to that deployment.
- One v1 instance must not be presented as a universal bot for unrelated guilds with different backends.
- The MediaOps Community bot is a restricted demo bot only.

This boundary is documented in `DISCORD_BOT_SETUP.md`, `RELEASE_SCOPE_V1.md`, `KNOWN_LIMITATIONS.md`, and `SECURITY_MODEL.md`.

## Clean-install validation completed

A clean Portainer/ADM installation using the published `:latest` image demonstrated:

- creation/use of a dedicated Discord application and bot;
- bot connection to a fresh guild;
- runtime `npm run deploy-commands` registration of all 15 commands;
- `/health` reporting the expected `latest` build and provider connectivity;
- `/mediaops-setup`, `/watchparty-setup`, and `/mediaops-admin-setup` publication;
- `/movie`, `/tv`, and `/latest` against Emby;
- `/request` search and real Ombi request creation;
- independent companion-router deployment and persistent `/data` state;
- Discord Forum request lifecycle integration;
- Watch Party scheduling with the configured MediaOps timezone;
- `@here` RSVP announcement behavior;
- deployment of the final merged v1 baseline through the `:latest` image.

The Watch Party lifecycle/hardening work was also validated during development, including reminder/launch tracking, cancellation, cleanup, expiry behavior, and restart-safe persistence.

## Automated release gate

The final merged v1 baseline on `main` passed:

- TypeScript typecheck;
- **70 automated tests, 70 passed, 0 failed**;
- `npm audit` with **0 vulnerabilities reported** at the validated release gate;
- production application build;
- companion router Python compile validation;
- companion router Docker build;
- MediaOps Docker build;
- successful publication of the `main`/`latest` container images.

These results describe the validated commit/dependency state at that gate; future dependency changes must be re-audited rather than assuming the result remains permanent.

## Final blockers before v1.0.0 tag

### 1. Documentation and presentation

- Complete the final cross-document consistency pass.
- Keep screenshots limited to real v1 behavior and inspect them for private information.
- Prepare release notes from `CHANGELOG.md`.
- Keep future features clearly identified as roadmap items rather than current functionality.

### 2. Secret and privacy review

Before making the repository public/tagging:

- confirm no Discord tokens, webhook credentials, Ombi/Emby API keys, passwords, private hostnames, private IP addresses, or personal credentials are present in tracked content;
- review Git history for accidentally committed secrets where practical;
- inspect screenshots for secrets, private addresses, personal usernames, and unrelated server information;
- verify runtime logs do not print secrets;
- rotate any credential that was ever accidentally exposed.

### 3. Public repository validation

Once repository visibility is changed to public:

- verify README screenshots and documentation links render correctly;
- verify raw icon/template/documentation URLs are publicly reachable;
- verify GHCR images can be pulled without relying on an authenticated development environment or local cache;
- verify project metadata and support/community links are appropriate for public users.

### 4. Unraid Community Apps preparation

Before submission:

- verify the public templates link users to the Discord bot setup documentation;
- verify descriptions, support/project links, icons, defaults, paths, and secret fields are appropriate;
- run the current Community Apps **Validate** workflow;
- run the current Community Apps **Scan** workflow;
- resolve every reported issue;
- submit only after the tagged public image and documentation are stable.

## Non-blocking post-release work

- richer interactive `/movie` and `/tv` media details and actions;
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

The first public release is intentionally a documented, reproducible, and security-conscious self-hosted baseline. Its advertised Emby/Ombi/Watch Party workflows should work for a new operator without silently sharing one deployment's backend with unrelated Discord guilds.
