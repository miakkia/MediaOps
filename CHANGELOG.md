# Changelog

All notable changes to MediaOps are documented here.

## [Unreleased]

The current `main` baseline is being validated as the first public release candidate. Final release tagging follows the clean-install acceptance test.

### Added

- Discord bot foundation with automatic modular slash-command discovery.
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
- Release-scope, readiness, known-limitations, security, architecture, provider, Discord UX, and deployment documentation.

### Security

- Hardened Emby API client with URL/protocol validation, bounded timeouts, explicit redirect behavior, and response validation.
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

### Changed

- Shared Watch Party scheduling logic is used by manual and random scheduling flows.
- Organizer cancellation remains available after a scheduled Watch Party becomes active.
- Discord and Watch Party consumers use generic provider boundaries instead of direct service imports where applicable.
- Public-facing branding defaults are generic and deployment-configurable.
- Public setup panels reduce the need for members to discover or memorize slash commands.
- README and deployment documentation now describe the first public release candidate and clean-install acceptance path.

## Development history

The first public baseline was built through iterative milestones and reviewed feature/hardening branches. Git history and pull requests remain the source of truth for individual implementation commits and review context.
