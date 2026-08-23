# Changelog

All notable changes to MediaOps are documented here.

MediaOps is currently in active development. Until the first stable public release, changes are grouped under **Unreleased** and summarized from merged and in-progress feature work.

## [Unreleased]

### Added

- Discord bot foundation and modular slash-command framework.
- Automatic command discovery/loading.
- Emby system health integration.
- Emby movie search.
- Emby TV-series search.
- Recently added movie and series discovery.
- Ombi-backed `/request` workflow with Discord requester attribution and configurable auto-approval.
- Optional Discord Forum request history synchronized from the companion Ombi Discord Router.
- Request Forum lifecycle tags for `Requested`, `Processing`, `Available`, `Failed`, and `Denied` while preserving `Movie`/`Series` media type.
- Completed request Forum posts are locked and removed from the active Forum view without deleting request history.
- Watch Party service integration.
- Watch Party code validation and status flows.
- Persistent scheduled Watch Party state.
- Upcoming Watch Party discovery through `/watchparty-upcoming`.
- Automatic Watch Party lifecycle scheduler.
- Persistent one-time Watch Party reminders before scheduled start.
- Configurable automated-message locale through `MEDIAOPS_LOCALE`.
- Scheduled Watch Party announcements with Discord timestamps.
- Going / Not Going RSVP controls.
- Organizer-only Watch Party cancellation.
- Library-wide random movie picker.
- Random-movie reroll and explicit movie selection.
- Guided Watch Party scheduling through Discord modals.
- Public bilingual EN/FR Watch Party setup panel.
- Media-title matching across display title, original title, and sort title where provider metadata is available.
- EN/FR internationalization foundation for Discord interactions.
- Implemented `MediaProvider` abstraction with Emby as the first provider adapter.
- Runtime provider selection through `MEDIA_PROVIDER`.
- Production TypeScript build targeting `dist/`.
- Multi-stage Docker image with a dedicated non-root runtime user.
- Automated GHCR image publication through GitHub Actions.
- Development, stable/latest, commit-SHA and semantic-version GHCR tagging strategy.
- Persistent Docker runtime data under `/data`.
- Validated deployment on Unraid without copying source code to the server.
- Preconfigured Unraid Docker template with appdata and environment variables.
- Unraid Community Apps repository profile (`ca_profile.xml`).
- MediaOps application icon integration for Unraid metadata.
- Docker, GHCR and Unraid installation documentation.
- Project roadmap covering multi-provider support and Unraid Community Apps.
- Architecture, product scope, provider model, security model, Discord feature, development, vision and deployment documentation.

### Security

- Hardened Emby API client with URL/protocol validation.
- Bounded provider request timeouts.
- Explicit redirect behavior.
- Provider-response structure validation.
- Input validation for Discord interaction identifiers and scheduling data.
- Runtime data kept outside source control.
- Docker runtime executes as a dedicated non-root user.
- Docker deployment requires no privileged mode, Docker socket, media-library mounts or inbound application ports for current features.
- Optional request Forum synchronization is fail-closed unless its complete identifier set is configured.
- Request Forum state changes are scoped to the configured Forum and integration source rather than free-form Discord messages.
- Managed request threads require an unambiguous media type and request status before MediaOps will modify them.
- Completed request states are terminal and cannot be automatically rewritten through later integration events.
- The webhook secret remains outside MediaOps; MediaOps uses only the configured webhook ID for source identification.

### Fixed

- Failed Watch Party announcements are rolled back to `auto_cancelled` so they do not remain visible as valid upcoming sessions.
- Discord `50001 Missing Access` scheduling failures now return a clear channel-permission message.

### Changed

- Shared Watch Party scheduling logic extracted so manual and random scheduling use the same workflow.
- Discord command and interaction text progressively moved into the i18n layer.
- Media item model expanded with original-title and sort-title metadata for better matching.
- Discord and Watch Party consumers now use the generic media provider boundary instead of direct Emby service imports.
- README and deployment documentation now reflect the working GHCR/Unraid path and Community Apps packaging.

## Development history

The current Unreleased work was built through iterative milestones and feature branches. Git history and pull requests remain the source of truth for individual implementation commits and review context.
