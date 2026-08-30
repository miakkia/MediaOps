# Changelog

All notable changes to MediaOps are documented here.

## [Unreleased]

The current baseline is in final preparation for the first public self-hosted v1.0.0 release. Core feature work, clean-install validation, and the final automated release gate are complete; public repository/distribution checks remain before tagging.

### Added

- **Rich Media Cards** for `/movie`, `/tv`, `/latest`, and `/request`, replacing plain text search output with compact visual results.
- Movie cards show poster artwork, title, and year.
- TV cards show poster artwork, title, year, and lifecycle status such as Continuing / En cours or Ended / Terminée when the provider exposes it.
- Ombi request search keeps the existing request state/actions while adding the same Rich Media Card presentation.
- Emby poster artwork is fetched server-side and uploaded to Discord as an attachment so the Emby API key is never placed in a Discord image URL.
- Discord bot foundation with automatic modular slash-command discovery.
- Operator-owned Discord bot setup documentation for the self-hosted v1 model.
- Emby health, movie search, TV-series search, and recently-added discovery.
- Ombi-backed `/request` workflow with Discord requester attribution and configurable auto-approval.
- Persistent request tracking and one-time Discord DM availability notification.
- Optional Discord Forum request history synchronized through the companion Ombi Discord Router.
- Request Forum lifecycle tags for Requested, Processing, Available, Failed, and Denied while preserving Movie/Series media type.
- Packaged and hardened Ombi Discord Router with persistent thread correlation and separate GHCR publication.
- Watch Party code validation, status, scheduling, upcoming-session discovery, RSVP, and persistent lifecycle state.
- One-time T-15 Watch Party reminders with restart-safe deduplication.
- Automatic Watch Party room creation at scheduled start and direct `/party/CODE` links.
- Organizer-only Watch Party cancellation, including after room activation.
- Tracked Watch Party announcement/reminder/open-room cleanup.
- Runtime-aware Watch Party expiry using Emby runtime plus a 45-minute grace period, with a 4.5-hour fallback when runtime is unavailable.
- Library-wide random movie picker with reroll and guided scheduling.
- `/mediaops-setup` user-facing command guide.
- `/mediaops-admin-setup` administrator diagnostics guide.
- Enhanced `/watchparty-setup` panel including upcoming/status guidance.
- Configurable public branding through `MEDIAOPS_BOT_NAME` and `MEDIAOPS_SERVER_NAME`.
- EN/FR internationalization foundation and configurable automated-message locale.
- `MediaProvider` abstraction with Emby as the first adapter and request-provider abstraction with Ombi as the first adapter.
- Multi-stage production Docker image with dedicated non-root runtime user.
- Runtime-safe `npm run deploy-commands` using compiled JavaScript from the published container.
- GHCR development, latest, SHA, and semantic-version tagging strategy.
- Persistent Docker runtime data under `/data`.
- Unraid templates, Community Apps profile, application icon, and deployment documentation.
- Public feature screenshots covering Rich Media Cards, library search, Ombi requests, Forum lifecycle, Watch Party, and the Discord command guide.

### Security

- V1 deployment model explicitly documented as self-hosted/single-tenant with an operator-owned Discord application/bot.
- Public Community demo bot is documented as non-universal and should not be invited into unrelated guilds.
- Hardened Emby API client with URL/protocol validation, bounded timeouts, explicit redirect behavior, and response validation.
- Rich Media Card artwork handling keeps Emby credentials server-side, caps poster downloads, and avoids exposing provider API keys in Discord image URLs.
- Ombi Rich Media Card artwork is limited to trusted TMDB HTTPS image URLs.
- Input validation for Discord identifiers and scheduling data.
- User-bound, short-lived request-selection tokens.
- Runtime data and secrets kept outside source control.
- Main Docker runtime executes as a dedicated non-root user.
- Current deployment requires no privileged mode, Docker socket, media-library mounts, or inbound MediaOps application ports.
- Optional request Forum synchronization remains fail-closed unless its complete identifier set is configured.
- Request Forum state changes are scoped to the configured Forum and integration source.
- Completed request states are terminal.
- Discord webhook credentials remain isolated in the companion router and are sanitized from delivery errors/logs.
- Administrator setup/diagnostic commands use Discord Manage Server permission by default; diagnostic replies are ephemeral.

### Fixed

- Failed Watch Party announcements roll back to `auto_cancelled` rather than remaining visible as valid upcoming sessions.
- Discord `50001 Missing Access` scheduling failures return a clear channel-permission message.
- Watch Party store mutations are serialized to avoid concurrent persistence loss.
- Watch Party fallback expiry is consistently 4.5 hours.
- Watch Party reminders and launch messages are tracked for lifecycle cleanup.
- Production containers can deploy Discord commands without the development-only `tsx` package.
- Manual and random Watch Party modal scheduling now interprets entered date/time in `MEDIAOPS_TIMEZONE` instead of depending on the container process timezone.

### Changed

- `/movie`, `/tv`, `/latest`, and `/request` now use a consistent compact Rich Media Card UX for media discovery.
- Public v1 is explicitly defined as one self-hosted MediaOps instance + one operator-owned Discord bot + one backend configuration.
- Hosted/universal multi-tenant operation is classified as **Future / Maybe**, with no committed target release; any future implementation requires a separate security-first multi-tenant architecture.
- Shared Watch Party scheduling logic is used by manual and random scheduling flows.
- Organizer cancellation remains available after a scheduled Watch Party becomes active.
- Initial Watch Party RSVP announcements can use `@here` to surface the event when the bot has the required Discord mention permission.
- Discord and Watch Party consumers use generic provider boundaries where applicable.
- Public-facing branding defaults are generic and deployment-configurable.
- Public setup panels reduce the need for members to discover or memorize slash commands.
- README, Docker, Unraid, release scope, limitations, and Community Apps template wording reflect the supported self-hosted deployment model.
- README now credits the external [Oratorian/emby-watchparty](https://github.com/Oratorian/emby-watchparty) project used for synchronized Watch Party playback.

## Development history

The first public baseline was built through iterative milestones and reviewed feature/hardening branches. Git history and pull requests remain the source of truth for individual implementation commits and review context.
