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
- Watch Party service integration.
- Watch Party code validation and status flows.
- Persistent scheduled Watch Party state.
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

### Changed

- Shared Watch Party scheduling logic extracted so manual and random scheduling use the same workflow.
- Discord command and interaction text progressively moved into the i18n layer.
- Media item model expanded with original-title and sort-title metadata for better matching.
- Discord and Watch Party consumers now use the generic media provider boundary instead of direct Emby service imports.
- README and deployment documentation now reflect the working GHCR/Unraid path and Community Apps packaging.

## Development history

The current Unreleased work was built through the following milestones:

- **#1** — establish Discord bot foundation
- **#2** — add Discord command framework
- **#3** — add Emby client and health command
- **#4** — harden Emby API client
- **#5** — add Emby movie search and command auto-loading
- **#6** — add Emby TV-series search
- **#7** — add latest media and Watch Party integration
- **#8** — add Watch Party scheduling, RSVP and cancellation
- **#9** — add Watch Party random picker and setup panel
- **Current branch** — introduce the MediaProvider abstraction, production Docker/GHCR deployment path and Unraid Community Apps packaging foundation

A versioned changelog section will be created when MediaOps begins tagged public releases.
