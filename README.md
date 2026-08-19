# MediaOps

MediaOps is an open-source Discord companion for self-hosted media communities. It connects Discord to a media server and provides media discovery, Watch Party coordination, scheduling, RSVP, and community-facing controls without requiring users to learn a large command set.

> **Project status:** active development. Emby is the current media provider. Jellyfin and Plex are planned through a future provider abstraction.

## What MediaOps does today

MediaOps currently provides:

- Discord bot health and media-server connectivity checks;
- Emby movie search;
- Emby TV-series search;
- recently added movie and series discovery;
- library-wide random movie selection;
- title matching using display title, original title, and sort title where available;
- Watch Party links and code validation;
- scheduled Watch Party announcements;
- Going / Not Going RSVP controls;
- organizer-only cancellation;
- guided scheduling with Discord modals;
- a bilingual EN/FR public Watch Party setup panel;
- persistent Watch Party runtime state.

The normal-user experience is intentionally short and button-driven. Slash commands remain available for direct access, while common Watch Party actions can be exposed through a public setup panel.

## Current Discord commands

| Command | Purpose |
| --- | --- |
| `/ping` | Confirm that MediaOps is online |
| `/health` | Check MediaOps and media-server connectivity |
| `/movie` | Search the movie library |
| `/tv` | Search the TV-series library |
| `/latest` | Show recently added media |
| `/watchparty` | Open the configured Watch Party service |
| `/watchparty-start` | Validate a Watch Party code and provide a join action |
| `/watchparty-status` | Check a Watch Party session |
| `/watchparty-schedule` | Schedule a Watch Party |
| `/watchpartyrandom` | Pick, reroll, choose, and schedule a random movie |
| `/watchparty-setup` | Publish the bilingual self-service Watch Party panel |

See [`docs/DISCORD_FEATURES.md`](docs/DISCORD_FEATURES.md) for the interaction model and detailed flows.

## Current architecture

MediaOps is currently a TypeScript/Node.js Discord application using `discord.js`. Emby access is performed through a bounded API client rather than direct access to media files. Watch Party scheduling state is application-owned runtime data and is kept separate from source code.

The long-term architecture separates Discord workflows from provider-specific implementations:

```text
Discord / MediaOps workflows
          |
          v
     MediaProvider
     /     |      \
  Emby  Jellyfin  Plex
```

Watch Party integrations are expected to use a separate provider capability because media-library access and synchronized playback are not the same concern.

See [`docs/PROVIDER_MODEL.md`](docs/PROVIDER_MODEL.md) and [`docs/ARCHITECTURE_PRINCIPLES.md`](docs/ARCHITECTURE_PRINCIPLES.md).

## Security posture

MediaOps is designed to require narrow API access rather than broad host access.

Key principles:

- no secrets committed to Git;
- no media-library filesystem mounts required for normal provider access;
- external API responses and Discord interaction input are validated;
- provider requests use bounded timeouts;
- runtime state is kept outside source control;
- future production containers should run without privileged mode and with minimal permissions.

See [`SECURITY.md`](SECURITY.md) and [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md).

## Self-hosting and deployment

MediaOps is being developed as a self-hosted-first application. The production deployment path is planned around Docker, GHCR, persistent application data, and eventually an Unraid Community Apps template.

The first public deployment target may ship as **MediaOps for Emby**. Jellyfin and Plex support do not need to block the initial self-hosted release.

Deployment documentation and a production Docker image are still roadmap items; the repository should currently be treated as an active development project rather than a finished packaged release.

## Documentation

- [`docs/VISION.md`](docs/VISION.md) — product direction and long-term identity
- [`docs/PRODUCT_SCOPE.md`](docs/PRODUCT_SCOPE.md) — what MediaOps is and is not intended to do
- [`docs/DISCORD_FEATURES.md`](docs/DISCORD_FEATURES.md) — current Discord capabilities and UX
- [`docs/ARCHITECTURE_PRINCIPLES.md`](docs/ARCHITECTURE_PRINCIPLES.md) — architectural rules
- [`docs/PROVIDER_MODEL.md`](docs/PROVIDER_MODEL.md) — Emby/Jellyfin/Plex provider direction
- [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md) — trust boundaries and security goals
- [`docs/DEVELOPMENT_GUIDELINES.md`](docs/DEVELOPMENT_GUIDELINES.md) — contribution and engineering conventions
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — planned work and distribution goals
- [`CHANGELOG.md`](CHANGELOG.md) — notable project changes

## Roadmap highlights

Near-term work includes Watch Party lifecycle improvements, timezone configuration, automated tests, CI, production Docker packaging, and public self-hosting documentation.

Longer term, MediaOps is intended to support multiple media providers, beginning with the current Emby implementation and later adding Jellyfin and Plex adapters after their APIs and Watch Party capabilities are verified.

Unraid Community Apps distribution is also a planned target once the production container has been proven stable independently.

## License

See [`LICENSE`](LICENSE) for the repository's license terms.
